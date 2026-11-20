import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadows } from '../constants/colors';

interface QuestionItem {
  id: number;
  statement: string;
  isFact: boolean; // true = Fakta, false = Mitos
  explanation: string;
}

const QUIZZES: QuestionItem[] = [
  {
    id: 1,
    statement: 'Gula aren atau gula jawa aman dikonsumsi sebanyak-banyaknya karena alami?',
    isFact: false,
    explanation:
      'Mitos! Gula aren tetap mengandung sukrosa dan kalori tinggi (~380 kkal/100g). Konsumsinya tetap harus dibatasi seperti gula pasir biasa.',
  },
  {
    id: 2,
    statement: 'Minum air putih yang cukup membantu ginjal membuang kelebihan gula lewat urin?',
    isFact: true,
    explanation:
      'Fakta! Saat gula darah naik, ginjal bekerja keras menyaringnya. Air putih membantu memperlancar proses ekskresi tanpa menambah beban kalori.',
  },
  {
    id: 3,
    statement: 'Gula alami dalam buah utuh diserap tubuh lebih lambat daripada minuman manis sirup?',
    isFact: true,
    explanation:
      'Fakta! Serat pangan (pektin) pada buah utuh memperlambat laju penyerapan glukosa ke pembuluh darah sehingga insulin tidak melonjak tiba-tiba.',
  },
  {
    id: 4,
    statement: 'Minuman dengan klaim "Less Sugar" sudah pasti bebas risiko lonjakan gula?',
    isFact: false,
    explanation:
      'Mitos! Less sugar sering kali masih mengandung 15-20 gram gula per cup (setara 4-5 sendok teh gula). Tetap perhatikan porsinya ya!',
  },
];

export const MythFactChallengeCard: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  const quiz = QUIZZES[currentIdx];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === quiz.isFact;

  const handleAnswer = (choice: boolean) => {
    setSelectedAnswer(choice);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setCurrentIdx((prev) => (prev + 1) % QUIZZES.length);
  };

  return (
    <View style={[styles.card, Shadows.card]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={styles.bulbIconBox}>
            <Ionicons name="help-buoy-outline" size={17} color="#188F7B" />
          </View>
          <Text style={styles.badgeText}>Tantangan Edukasi Harian</Text>
        </View>

        <Text style={styles.counterText}>
          {currentIdx + 1} / {QUIZZES.length}
        </Text>
      </View>

      {/* Statement Question */}
      <Text style={styles.statementText}>"{quiz.statement}"</Text>

      {/* Buttons */}
      {!isAnswered ? (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.answerBtn, styles.mythBtn]}
            activeOpacity={0.8}
            onPress={() => handleAnswer(false)}
          >
            <Ionicons name="close-circle-outline" size={18} color="#D9531E" />
            <Text style={styles.mythBtnText}>Mitos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.answerBtn, styles.factBtn]}
            activeOpacity={0.8}
            onPress={() => handleAnswer(true)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#176E60" />
            <Text style={styles.factBtnText}>Fakta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultBox}>
          <View style={styles.resultHeader}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'information-circle'}
              size={20}
              color={isCorrect ? '#188F7B' : '#D9531E'}
            />
            <Text
              style={[
                styles.resultTitle,
                { color: isCorrect ? '#176E60' : '#D9531E' },
              ]}
            >
              {isCorrect ? 'Tepat Sekali! 🎉' : 'Kurang Tepat, yuk pelajari! 💡'}
            </Text>
          </View>

          <Text style={styles.explanationText}>{quiz.explanation}</Text>

          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>Tantangan Berikutnya</Text>
            <Ionicons name="arrow-forward" size={14} color="#403936" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulbIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#E9FAF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#188F7B',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0958F',
  },
  statementText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    color: '#403936',
    marginVertical: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  answerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  mythBtn: {
    backgroundColor: '#FFF0E5',
    borderColor: '#FFD3B6',
  },
  mythBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D9531E',
  },
  factBtn: {
    backgroundColor: '#E9FAF4',
    borderColor: '#A8E6CF',
  },
  factBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#176E60',
  },
  resultBox: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6D625D',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFE8E2',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  nextBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#403936',
  },
});
