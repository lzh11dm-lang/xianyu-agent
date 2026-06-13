/**
 * 首页 - 对话式运营助手
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { sendMessage, getChatHistory, clearChatHistory, checkBrowserStatus } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export default function HomeScreen() {
  const router = useSafeRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // 初始化：检查浏览器连接 & 加载历史
  useEffect(() => {
    initApp();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  async function initApp() {
    try {
      // 检查浏览器连接
      const status = await checkBrowserStatus();
      setIsConnected(status.connected);

      // 加载历史
      const history = await getChatHistory();
      if (history.success && history.history.length > 0) {
        setMessages(
          history.history.map((item, index) => ({
            id: `init-${index}`,
            role: item.role,
            content: item.content,
            timestamp: item.timestamp,
          }))
        );
      } else {
        // 欢迎消息
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是咸鱼运营助手。\n\n请确保比特浏览器已运行并登录闲鱼账号，我就能帮你：\n• 自动创建投流计划\n• 查看投流数据\n• 执行各种运营操作\n\n有什么可以帮你的？',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

  async function handleSend() {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // 添加用户消息
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: userMessage, timestamp: Date.now() },
    ]);

    try {
      const response = await sendMessage(userMessage);

      if (response.success) {
        // 添加助手回复
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.reply,
            timestamp: Date.now(),
          },
        ]);
      } else {
        Alert.alert('错误', response.reply || '发送失败');
      }
    } catch (error: any) {
      Alert.alert('网络错误', error.message || '请检查后端服务是否运行');
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '网络连接失败，请确保后端服务已启动。',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickAction(action: string) {
    setInputValue(action);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 顶部状态栏 */}
        <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                咸鱼运营助手
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                帮您自动化执行投流 SOP
              </Text>
            </View>
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-full ${
                isConnected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
              }`}
              onPress={initApp}
            >
              <Text
                className={`text-xs font-medium ${
                  isConnected ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                {isConnected ? '● 已连接' : '○ 未连接'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.settingsBtnText}>设置</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 消息列表 */}
        <ScrollView ref={scrollRef} className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`mb-4 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <View
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-500 rounded-br-md'
                    : msg.role === 'system'
                    ? 'bg-amber-100 dark:bg-amber-900/30 rounded-lg'
                    : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
                }`}
              >
                <Text
                  className={`text-sm leading-5 ${
                    msg.role === 'user'
                      ? 'text-white'
                      : msg.role === 'system'
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-gray-800 dark:text-gray-100'
                  }`}
                  
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {/* 加载中 */}
          {isLoading && (
            <View className="items-start mb-4">
              <View className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* 快捷操作 */}
        <View className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <TouchableOpacity
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mr-2"
              onPress={() => handleQuickAction('帮我创建曝光计划，出价20元，日预算40元')}
            >
              <Text className="text-xs text-indigo-600 dark:text-indigo-400">创建曝光计划</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mr-2"
              onPress={() => handleQuickAction('查看今日投流数据')}
            >
              <Text className="text-xs text-indigo-600 dark:text-indigo-400">查看数据</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mr-2"
              onPress={() => handleQuickAction('打开大鱼平台')}
            >
              <Text className="text-xs text-indigo-600 dark:text-indigo-400">打开大鱼平台</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full"
              onPress={() => handleQuickAction('截图看看当前页面')}
            >
              <Text className="text-xs text-indigo-600 dark:text-indigo-400">截图</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 输入框 */}
        <View className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <View className="flex-row items-end">
            <TextInput
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-white max-h-32"
              placeholder="输入你的运营指令..."
              placeholderTextColor="#9ca3af"
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              editable={!isLoading}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              className={`ml-3 w-11 h-11 rounded-full justify-center items-center ${
                inputValue.trim() && !isLoading
                  ? 'bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
              onPress={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              <Text className="text-white text-lg">↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  settingsBtn: {
    padding: 8,
    marginLeft: 8,
  },
  settingsBtnText: {
    fontSize: 20,
  },
});
