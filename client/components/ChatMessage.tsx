import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isLoading?: boolean;
  timestamp?: Date;
}

export function ChatMessage({ role, content, isLoading, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <View className={`flex-row px-4 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI 头像 */}
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 items-center justify-center mr-2 flex-shrink-0">
          <Text className="text-white text-xs font-bold">AI</Text>
        </View>
      )}

      {/* 消息内容 */}
      <View
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 rounded-tr-sm'
            : 'bg-gray-800 rounded-tl-sm'
        }`}
      >
        {isLoading ? (
          <View className="flex-row items-center">
            <Text className="text-white text-sm">思考中</Text>
            <View className="ml-2 flex-row">
              <Text className="text-cyan-400 animate-pulse">.</Text>
              <Text className="text-cyan-400 animate-pulse delay-100">.</Text>
              <Text className="text-cyan-400 animate-pulse delay-200">.</Text>
            </View>
          </View>
        ) : (
          <>
            <Text className="text-white text-sm leading-5">{content}</Text>
            {timestamp && (
              <Text className="text-gray-400 text-xs mt-1">
                {timestamp.toLocaleTimeString()}
              </Text>
            )}
          </>
        )}
      </View>

      {/* 用户头像 */}
      {isUser && (
        <View className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center ml-2 flex-shrink-0">
          <Text className="text-white text-xs font-bold">ME</Text>
        </View>
      )}
    </View>
  );
}
