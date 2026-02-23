import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';
import AIChatBubble from '../../components/AIChatBubble';
import { useAIInsights } from '../../hooks/useAIInsights';

const QUICK_PROMPTS = [
  { label: 'How can we reduce CO2 this week?', icon: 'leaf-outline' as const },
  { label: 'Top 3 green route optimizations today', icon: 'map-outline' as const },
  { label: 'Which shipments are highest emission risk?', icon: 'warning-outline' as const },
];

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={typingStyles.container}>
      <View style={typingStyles.bubble}>
        <View style={typingStyles.label}>
          <Ionicons name="sparkles" size={11} color="#16a34a" />
          <Text style={typingStyles.labelText}>GreenChain AI is thinking…</Text>
        </View>
        <View style={typingStyles.dots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  labelText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginLeft: 4,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginHorizontal: 2,
  },
});

export default function InsightsScreen() {
  const { messages, isLoading, sendMessage } = useAIInsights();
  const [inputText, setInputText] = useState('');
  const inputScaleAnim = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const emptyIconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(emptyIconScale, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(emptyIconScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleInputFocus = () => {
    Animated.spring(inputScaleAnim, { toValue: 1.015, useNativeDriver: true }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(inputScaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    Animated.sequence([
      Animated.timing(sendButtonScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(sendButtonScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    sendMessage(inputText);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => <AIChatBubble message={item} />;

  const isActive = inputText.trim().length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <GradientHeader
        title="AI Insights"
        subtitle="Get intelligent recommendations"
        icon="lightbulb"
      />

      {/* Insight Card */}
      <View style={styles.insightCard}>
        <LinearGradient
          colors={['#f0fdf4', '#dcfce7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.insightCardGradient}
        >
          <View style={styles.insightCardHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={13} color="#16a34a" />
              <Text style={styles.aiBadgeText}>AI Powered</Text>
            </View>
          </View>
          <Text style={styles.insightCardTitle}>Ask GreenChain AI</Text>
          <Text style={styles.insightCardSubtitle}>
            Get clear actions on emissions, routes, and sustainability targets.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptRow}
          >
            {QUICK_PROMPTS.map(({ label, icon }) => (
              <TouchableOpacity
                key={label}
                style={styles.quickPromptChip}
                onPress={() => setInputText(label)}
                activeOpacity={0.75}
              >
                <Ionicons name={icon} size={13} color="#15803d" style={{ marginRight: 5 }} />
                <Text style={styles.quickPromptText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Chat list */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#dcfce7', '#bbf7d0']}
                style={styles.emptyIconCircle}
              >
                <Animated.View style={{ transform: [{ scale: emptyIconScale }] }}>
                  <Ionicons name="sparkles" size={32} color="#16a34a" />
                </Animated.View>
              </LinearGradient>
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateText}>
                Tap a suggestion above or type a question to start your AI insights conversation.
              </Text>
              <View style={styles.emptyHintRow}>
                {(['leaf-outline', 'map-outline', 'bar-chart-outline'] as const).map((icon, i) => (
                  <View key={i} style={styles.emptyHintDot}>
                    <Ionicons name={icon} size={14} color="#86efac" />
                  </View>
                ))}
              </View>
            </View>
          ) : null
        }
      />

      {/* Input bar */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Animated.View
            style={[styles.inputFieldWrap, { transform: [{ scale: inputScaleAnim }] }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#86efac" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Ask about emissions, routes, or targets…"
              placeholderTextColor="#a7f3d0"
              multiline
              maxLength={500}
            />
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!isActive}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isActive ? ['#22c55e', '#16a34a'] : ['#d1d5db', '#9ca3af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButton}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {inputText.length > 0 && (
          <Text style={styles.charCount}>{inputText.length} / 500</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  /* Insight card */
  insightCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  insightCardGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  insightCardHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#86efac',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: 3,
  },
  insightCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14532d',
    letterSpacing: -0.3,
  },
  insightCardSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  quickPromptRow: {
    marginTop: 12,
    paddingRight: 4,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#86efac',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  quickPromptText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Chat */
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1fae5',
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14532d',
    letterSpacing: -0.2,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyHintRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  emptyHintDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Input */
  inputWrapper: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 16,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputFieldWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    maxHeight: 110,
  },
  inputIcon: {
    marginRight: 8,
    marginBottom: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#14532d',
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 21,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  charCount: {
    marginTop: 6,
    marginRight: 60,
    fontSize: 11,
    color: '#86efac',
    textAlign: 'right',
  },
});
