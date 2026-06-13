import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View className="flex-row items-end px-4 py-3 border-t border-gray-800 bg-gray-900">
      <View className="flex-1 bg-gray-800 rounded-2xl px-4 py-3 mr-3">
        <TextInput
          className="text-white text-base"
          placeholder="输入指令..."
          placeholderTextColor="#6B7280"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
        />
      </View>
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        className={`w-12 h-12 rounded-full items-center justify-center ${
          text.trim() && !disabled
            ? 'bg-gradient-to-br from-cyan-400 to-purple-500'
            : 'bg-gray-700'
        }`}
      >
        <Text className="text-white text-lg">→</Text>
      </TouchableOpacity>
    </View>
  );
}
