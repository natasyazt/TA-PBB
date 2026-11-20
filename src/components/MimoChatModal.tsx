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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mascot } from './Mascot';

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
  '🧋 Boba vs Kopi Susu, mana gulanya lebih tinggi?',
  '🏃‍♂️ Gimana cara bakar gula hari ini?',
  '😴 Kenapa ngantuk setelah makan manis?',
  '🍓 Ide camilan manis yang sehat apa ya?',
  '🩺 Apa bedanya gula alami dan gula tambahan?',
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
  const scrollViewRef = useRef<any>(null);

  // Initialize welcoming message
  useEffect(() => {
    if (visible && messages.length === 0) {
      const remaining = Math.max(0, sugarLimit - todaySugar);
      let intro = `Halo ${userName}! 👋 Aku Mimo, teman sehat manismu.\n\nHari ini kamu sudah mengonsumsi ${Math.round(
        todaySugar
      )}g gula dari batas ${sugarLimit}g (sisa kuota: ${remaining.toFixed(0)}g).`;

      if (todaySugar > sugarLimit) {
        intro += '\n\nJangan panik ya! Kamu bisa minum lebih banyak air putih atau jalan santai 15 menit untuk bantu tubuhmu membakar kelebihannya.';
      } else {
        intro += '\n\nPola asupanmu masih oke banget! Mau tanya soal kalori makanan atau tips cegah diabetes?';
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

  const generateMimoResponse = (userQuestion: string): string => {
    const q = userQuestion.toLowerCase();

    if (q.includes('boba') || q.includes('kopi susu')) {
      return 'Boba Brown Sugar rata-rata punya 35–42 gram gula per cup (hampir menyentuh batas harian 50g!). Sedangkan Kopi Susu Gula Aren rata-rata 20–25 gram. Tips dari Mimo: pesan level "Less Sugar" (50% atau 30%) biar tetap enak tapi aman!';
    }
    if (q.includes('bakar') || q.includes('olahraga') || q.includes('jalan')) {
      return 'Setiap 20 gram gula setara dengan ~80 kkal energi. Kamu bisa membakarnya dengan:\n• Jalan kaki santai 20 menit (-10g gula)\n• Jogging ringan 10 menit (-15g gula)\n• Naik turun tangga 10 menit (-12g gula)\nAktivitas fisik membantu otot menyerap glukosa langsung dari darah tanpa membebani pankreas!';
    }
    if (q.includes('ngantuk') || q.includes('sugar crash') || q.includes('lemas')) {
      return 'Itu namanya "Sugar Crash"! Saat makan gula tinggi, insulin naik drastis untuk menurunkan gula darah secara cepat. Akibatnya otak kekurangan glukosa mendadak dan bikin kamu mengantuk lemas. Cara mengatasinya: seimbangkan dengan serat & protein (misal kacang-kacangan atau telur)!';
    }
    if (q.includes('camilan') || q.includes('buah') || q.includes('snack')) {
      return 'Camilan manis yang ramah diabetes dari Mimo:\n1. Buah apel/pir dipotong tipis dengan selai kacang murni\n2. Greek yogurt plain dengan potongan stroberi\n3. Dark chocolate (kandungan kakao >70%)\n4. Chia seed pudding susu almond\nRasanya tetap manis tapi indeks glikemiknya rendah!';
    }
    if (q.includes('alami') || q.includes('buah vs gula') || q.includes('beda')) {
      return 'Gula alami pada buah utuh (fruktosa) hadir bersama serat nabati, vitamin, dan air, sehingga glukosa diserap tubuh secara perlahan. Sedangkan gula tambahan (sukrosa/sirup jagung) langsung diserap cepat ke pembuluh darah dan bisa memicu lonjakan insulin.';
    }
    if (q.includes('diabetes') || q.includes('keturunan') || q.includes('gejala')) {
      return 'Jika ada riwayat keluarga, sensitivitas insulin cenderung lebih rendah. Langkah pencegahan terbaik: batasi gula tambahan maksimal 25-35g/hari, rutin jalan 30 menit sehari, dan perbanyak makanan berserat tinggi. Mimo siap ingatkan kamu setiap hari!';
    }
    if (q.includes('terima kasih') || q.includes('makasih') || q.includes('thanks')) {
      return 'Sama-sama! Selalu semangat ya, langkah kecil menjaga asupan manis hari ini adalah investasi sehat untuk masa depanmu! ✨';
    }

    return `Pertanyaan yang bagus soal "${userQuestion}"! Mengurangi makanan manis bukan berarti hidup tanpa rasa, tapi tentang bijak memilih takaran. Saran Mimo: selalu cek label gizi kemasan dan pilih opsi tawar jika bisa. Mau tanya hal lain seputar gula?`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const mimoAnswer = generateMimoResponse(text);
      const mimoMsg: Message = {
        id: `mimo-${Date.now()}`,
        sender: 'mimo',
        text: mimoAnswer,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, mimoMsg]);
      setIsTyping(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 600);
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
                    <Text style={styles.subtitle}>Teman Sehat Manismu (AI Companion)</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
                  <Ionicons name="close" size={20} color="#766A64" />
                </TouchableOpacity>
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
});
