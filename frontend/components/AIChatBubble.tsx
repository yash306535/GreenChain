import React, { FC } from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface AIChatBubbleProps {
  message: {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: string;
  };
  style?: ViewStyle;
}

// ─── Inline Markdown Parser ───────────────────────────────────────────────────
// Handles: ***bold italic***, **bold**, *italic*, `code`
function parseInline(raw: string, baseColor: string, key: string): React.ReactNode {
  const segments: React.ReactNode[] = [];
  // Order matters: longest match first
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push(
        <Text key={`${key}-t${i++}`} style={{ color: baseColor }}>
          {raw.slice(lastIndex, match.index)}
        </Text>
      );
    }
    if (match[2] !== undefined) {
      segments.push(
        <Text key={`${key}-bi${i++}`} style={{ fontWeight: '800', fontStyle: 'italic', color: baseColor }}>
          {match[2]}
        </Text>
      );
    } else if (match[3] !== undefined) {
      segments.push(
        <Text key={`${key}-b${i++}`} style={{ fontWeight: '700', color: baseColor }}>
          {match[3]}
        </Text>
      );
    } else if (match[4] !== undefined) {
      segments.push(
        <Text key={`${key}-i${i++}`} style={{ fontStyle: 'italic', color: baseColor }}>
          {match[4]}
        </Text>
      );
    } else if (match[5] !== undefined) {
      segments.push(
        <Text
          key={`${key}-c${i++}`}
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            fontSize: 13,
            backgroundColor: '#f1f5f9',
            color: '#0f4c35',
            borderRadius: 4,
            paddingHorizontal: 3,
          }}
        >
          {match[5]}
        </Text>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    segments.push(
      <Text key={`${key}-tail`} style={{ color: baseColor }}>
        {raw.slice(lastIndex)}
      </Text>
    );
  }

  return segments.length > 0 ? segments : raw;
}

// ─── Block Markdown Renderer ──────────────────────────────────────────────────
function MarkdownBody({ text, isUser }: { text: string; isUser: boolean }) {
  const baseColor = isUser ? '#ffffff' : '#111827';
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletGroupKey = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trimEnd();
    const lkey = `line-${idx}`;

    // Empty line → spacer
    if (trimmed.trim() === '') {
      elements.push(<View key={lkey} style={{ height: 5 }} />);
      return;
    }

    // H1: # Heading
    if (/^#\s+/.test(trimmed)) {
      elements.push(
        <Text key={lkey} style={[mdStyles.h1, { color: isUser ? '#fff' : '#0a2e1c' }]}>
          {parseInline(trimmed.replace(/^#\s+/, ''), isUser ? '#fff' : '#0a2e1c', lkey)}
        </Text>
      );
      return;
    }

    // H2: ## Heading
    if (/^##\s+/.test(trimmed)) {
      elements.push(
        <Text key={lkey} style={[mdStyles.h2, { color: isUser ? '#e5f9ee' : '#14532d' }]}>
          {parseInline(trimmed.replace(/^##\s+/, ''), isUser ? '#e5f9ee' : '#14532d', lkey)}
        </Text>
      );
      return;
    }

    // H3: ### Heading
    if (/^###\s+/.test(trimmed)) {
      elements.push(
        <Text key={lkey} style={[mdStyles.h3, { color: isUser ? '#bbf7d0' : '#166534' }]}>
          {parseInline(trimmed.replace(/^###\s+/, ''), isUser ? '#bbf7d0' : '#166534', lkey)}
        </Text>
      );
      return;
    }

    // Divider: ---
    if (/^-{3,}$/.test(trimmed.trim())) {
      elements.push(
        <View key={lkey} style={[mdStyles.divider, { backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : '#e5e7eb' }]} />
      );
      return;
    }

    // Unordered bullet: -, *, •
    const bulletMatch = trimmed.match(/^([-*•])\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <View key={lkey} style={mdStyles.bulletRow}>
          <View style={[mdStyles.bulletDot, { backgroundColor: isUser ? 'rgba(255,255,255,0.7)' : '#22c55e' }]} />
          <Text style={[mdStyles.bulletText, { color: baseColor }]}>
            {parseInline(bulletMatch[2], baseColor, lkey)}
          </Text>
        </View>
      );
      return;
    }

    // Ordered list: 1. 2. etc.
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      elements.push(
        <View key={lkey} style={mdStyles.bulletRow}>
          <Text style={[mdStyles.orderedNum, { color: isUser ? 'rgba(255,255,255,0.7)' : '#22c55e' }]}>
            {orderedMatch[1]}.
          </Text>
          <Text style={[mdStyles.bulletText, { color: baseColor }]}>
            {parseInline(orderedMatch[2], baseColor, lkey)}
          </Text>
        </View>
      );
      return;
    }

    // Paragraph
    elements.push(
      <Text key={lkey} style={[mdStyles.paragraph, { color: baseColor }]}>
        {parseInline(trimmed, baseColor, lkey)}
      </Text>
    );
  });

  return <View>{elements}</View>;
}

const mdStyles = StyleSheet.create({
  h1: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 4,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 3,
    marginTop: 5,
  },
  h3: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    borderRadius: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 9,
    flexShrink: 0,
  },
  orderedNum: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 7,
    lineHeight: 22,
    minWidth: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 2,
  },
});

// ─── Main Component ──────────────────────────────────────────────────────────

const AIChatBubble: FC<AIChatBubbleProps> = ({ message, style }) => {
  const isUser = message.sender === 'user';

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer, style]}>
      {/* AI avatar label */}
      {!isUser && (
        <View style={styles.aiLabelRow}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={11} color="#16a34a" />
          </View>
          <Text style={styles.aiLabelText}>GreenChain AI</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <MarkdownBody text={message.text} isUser={isUser} />

        <View style={[styles.timeRow, isUser ? styles.timeRowUser : styles.timeRowAI]}>
          {!isUser && (
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark-done" size={10} color="#22c55e" />
            </View>
          )}
          <Text style={[styles.time, isUser ? styles.userTime : styles.aiTime]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginHorizontal: 14,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },

  // AI label row
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 4,
  },
  aiAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  aiLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 0.2,
  },

  // Bubble shell
  bubble: {
    maxWidth: '87%',
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 5,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Timestamp row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeRowUser: {
    justifyContent: 'flex-end',
  },
  timeRowAI: {
    justifyContent: 'flex-start',
  },
  verifiedDot: {
    marginRight: 4,
  },
  time: {
    fontSize: 10,
  },
  userTime: {
    color: 'rgba(255,255,255,0.65)',
  },
  aiTime: {
    color: '#9ca3af',
  },
});

export default AIChatBubble;
