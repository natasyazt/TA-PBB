import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mascot } from './Mascot';
import { askMimoAI, getGeminiApiKey, setGeminiApiKey } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'mimo' | 'user';
  text: string;
  time: string;
}

interface MimoChatModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  todaySugar: number;
  sugarLimit: number;
}

const QUICK_PROMPTS = [
  '☕ Berapa gram pada kopi susu?',
  '🧋 Berapa gram gula pada boba?',
  '🍹 Berapa gram gula es teh manis?',
  '🍩 Berapa gram pada donat?',
  '🏃‍♂️ Gimana cara bakar gula hari ini?',
  '😴 Kenapa ngantuk setelah makan manis?',
  '🌿 Apakah pemanis stevia aman?',
  '🍎 Berapa gram gula pada pisang?',
];

export const MimoChatModal: React.FC<MimoChatModalProps> = ({
  visible,
  onClose,
  userName,
  todaySugar,
  sugarLimit,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // Load API Key status
  useEffect(() => {
    if (visible) {
      getGeminiApiKey().then((k) => {
        setApiKeyInput(k);
        setIsKeySaved(Boolean(k && k.trim().length > 10));
      });
    }
  }, [visible]);

  // Initialize welcoming message
  useEffect(() => {
    if (visible && messages.length === 0) {
      const remaining = Math.max(0, sugarLimit - todaySugar);
      let intro = `Halo ${userName}! 👋 Aku Mimo, asisten AI teman sehat manismu.\n\nHari ini kamu sudah mengonsumsi ${Math.round(
        todaySugar
      )}g gula dari batas ${sugarLimit}g (sisa kuota: ${remaining.toFixed(0)}g).`;

      if (todaySugar > sugarLimit) {
        intro += '\n\nJangan panik ya! Kamu bisa minum lebih banyak air putih atau jalan santai 15 menit untuk bantu tubuhmu membakar kelebihannya.';
      } else {
        intro += '\n\nPola asupanmu masih oke banget! Mau tanya berapa gram gula pada makanan/minumanmu, atau tips cegah diabetes?';
      }

      setMessages([
        {
          id: 'msg-init',
          sender: 'mimo',
          text: intro,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [visible]);

  const handleSaveApiKey = async () => {
    await setGeminiApiKey(apiKeyInput.trim());
    setIsKeySaved(Boolean(apiKeyInput.trim().length > 10));
    setShowApiKeyModal(false);
    Alert.alert(
      'Gemini AI',
      apiKeyInput.trim()
        ? 'Gemini API Key berhasil disimpan! Mimo kini terhubung langsung ke Google Gemini AI.'
        : 'API Key dihapus. Mimo beralih ke Mode Asisten Nutrisi Cerdas internal.'
    );
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    scrollViewRef.current?.scrollToEnd({ animated: true });

    try {
      const mimoAnswer = await askMimoAI(text, {
        userName,
        todaySugar,
        sugarLimit,
        recentMessages: messages.slice(-4),
      });

      const mimoMsg: Message = {
        id: `mimo-${Date.now()}`,
        sender: 'mimo',
        text: mimoAnswer,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, mimoMsg]);
    } catch {
      const fallbackMsg: Message = {
        id: `mimo-${Date.now()}`,
        sender: 'mimo',
        text: 'Maaf, Mimo sedang mengalami sedikit kendala jaringan. Tapi pesan penting Mimo: periksa selalu label kemasan dan pilih opsi less sugar ya! Mau tanya makanan lain?',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.mascotBadgeRow}>
                  <View style={styles.miniMascotBox}>
                    <Mascot status="optimal" size={40} compact />
                  </View>
                  <View>
                    <Text style={styles.title}>Ngobrol Bareng Mimo</Text>
                    <TouchableOpacity
                      style={[styles.geminiBadge, isKeySaved ? styles.geminiBadgeCloud : styles.geminiBadgeLocal]}
                      activeOpacity={0.7}
                      onPress={() => setShowApiKeyModal(true)}
                    >
                      <Ionicons name="sparkles" size={11} color={isKeySaved ? '#188F7B' : '#C25E40'} />
                      <Text style={[styles.geminiBadgeText, { color: isKeySaved ? '#188F7B' : '#C25E40' }]}>
                        {isKeySaved ? 'Gemini AI Aktif' : 'Mimo AI Aktif'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.headerRightGroup}>
                  <TouchableOpacity
                    style={styles.keySettingsBtn}
                    activeOpacity={0.7}
                    onPress={() => setShowApiKeyModal(true)}
                  >
                    <Ionicons name="key-outline" size={18} color="#766A64" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
                    <Ionicons name="close" size={20} color="#766A64" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Chat Message Scroll */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((item) => {
                  const isMimo = item.sender === 'mimo';
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.messageRow,
                        isMimo ? styles.messageRowMimo : styles.messageRowUser,
                      ]}
                    >
                      {isMimo && (
                        <View style={styles.chatAvatar}>
                          <Text style={{ fontSize: 13 }}>🧁</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.bubble,
                          isMimo ? styles.bubbleMimo : styles.bubbleUser,
                        ]}
                      >
                        <Text
                          style={[
                            styles.bubbleText,
                            isMimo ? styles.bubbleTextMimo : styles.bubbleTextUser,
                          ]}
                        >
                          {item.text}
                        </Text>
                        <Text
                          style={[
                            styles.timeText,
                            isMimo ? styles.timeTextMimo : styles.timeTextUser,
                          ]}
                        >
                          {item.time}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {isTyping && (
                  <View style={[styles.messageRow, styles.messageRowMimo]}>
                    <View style={styles.chatAvatar}>
                      <Text style={{ fontSize: 13 }}>🧁</Text>
                    </View>
                    <View style={[styles.bubble, styles.bubbleMimo, { paddingVertical: 12 }]}>
                      <ActivityIndicator size="small" color="#188F7B" />
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Quick Prompts Carousel */}
              <View style={styles.promptsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.promptsContent}
                >
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.promptChip}
                      activeOpacity={0.75}
                      onPress={() => handleSend(prompt)}
                    >
                      <Text style={styles.promptChipText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Chat Input Bar */}
              <View style={styles.inputBar}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tanya Mimo apa saja..."
                  placeholderTextColor="#A0948E"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !inputText.trim() && styles.sendBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                  disabled={!inputText.trim()}
                  onPress={() => handleSend()}
                >
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Gemini API Key Settings Sub-Modal */}
              {showApiKeyModal && (
                <View style={styles.apiKeyOverlay}>
                  <View style={styles.apiKeyCard}>
                    <View style={styles.apiKeyHeader}>
                      <View style={styles.sparkleIconBox}>
                        <Ionicons name="sparkles" size={18} color="#188F7B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.apiKeyTitle}>Pengaturan Google Gemini AI</Text>
                        <Text style={styles.apiKeySubtitle}>
                          Hubungkan Mimo ke cloud Google Gemini AI
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowApiKeyModal(false)}
                        style={styles.apiKeyClose}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={18} color="#8D7E77" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.apiKeyDesc}>
                      Mimo dilengkapi mesin AI Nutrisi Cerdas yang siap menjawab ratusan makanan, takaran gram gula, dan konsultasi pencegahan diabetes. Kamu juga dapat menambahkan Google Gemini API Key sendiri:
                    </Text>

                    <TextInput
                      style={styles.apiKeyInput}
                      placeholder="Tempel Gemini API Key (AIzaSy...)"
                      placeholderTextColor="#A0958F"
                      value={apiKeyInput}
                      onChangeText={setApiKeyInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Text style={styles.apiKeyHint}>
                      💡 API Key gratis dapat dibuat di aistudio.google.com/app/apikey
                    </Text>

                    <View style={styles.apiKeyBtnRow}>
                      <TouchableOpacity
                        style={styles.cancelApiKeyBtn}
                        onPress={() => {
                          setApiKeyInput('');
                          handleSaveApiKey();
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelApiKeyBtnText}>Gunakan Mode Lokal</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.saveApiKeyBtn}
                        onPress={handleSaveApiKey}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.saveApiKeyBtnText}>Simpan Key</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 32, 28, 0.48)',
    justifyContent: 'flex-end',
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
        } as any)
      : {}),
  },
  sheetContainer: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DED3CC',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2ECE4',
  },
  mascotBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniMascotBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#403936',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#188F7B',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    height: 340,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowMimo: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FFF0E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMimo: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    shadowColor: 'rgba(83, 65, 56, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: '#403936',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextMimo: {
    color: '#403936',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMimo: {
    color: '#A0958F',
  },
  timeTextUser: {
    color: '#C9BDB7',
  },
  promptsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F5EFE7',
    paddingVertical: 8,
  },
  promptsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#FFF6EE',
    borderWidth: 1,
    borderColor: '#FFD3B6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D4A35',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#403936',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF8F87',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255, 143, 135, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  geminiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  geminiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#188F7B',
  },
  geminiBadgeCloud: {
    backgroundColor: '#EAF8F4',
  },
  geminiBadgeLocal: {
    backgroundColor: '#FFF0EB',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keySettingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiKeyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 24, 20, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 32,
    zIndex: 100,
  },
  apiKeyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  apiKeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sparkleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#EAF8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiKeyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#403936',
  },
  apiKeySubtitle: {
    fontSize: 11,
    color: '#8D7E77',
    marginTop: 1,
  },
  apiKeyClose: {
    padding: 4,
  },
  apiKeyDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#655A54',
    marginBottom: 12,
  },
  apiKeyInput: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
    color: '#403936',
    marginBottom: 8,
  },
  apiKeyHint: {
    fontSize: 11,
    color: '#188F7B',
    marginBottom: 16,
    lineHeight: 15,
  },
  apiKeyBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelApiKeyBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#F3EDE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelApiKeyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6E615B',
  },
  saveApiKeyBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#188F7B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveApiKeyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
