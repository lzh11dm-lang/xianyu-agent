import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  action: string;
}

const quickActions: QuickAction[] = [
  { id: '1', icon: 'link', label: '连接浏览器', action: '连接比特浏览器' },
  { id: '2', icon: 'chart-line', label: '创建曝光计划', action: '帮我创建一个曝光计划，出价20元，日预算40元' },
  { id: '3', icon: 'list-check', label: '查看投流状态', action: '查看当前所有投流计划的状态' },
  { id: '4', icon: 'rotate', label: '刷新数据', action: '刷新最新的投流数据' },
];

interface QuickActionsProps {
  onSelect: (action: string) => void;
  isConnected: boolean;
}

export function QuickActions({ onSelect, isConnected }: QuickActionsProps) {
  return (
    <View className="px-4 py-2 border-b border-gray-800">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 py-1">
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.action)}
              className={`flex-row items-center px-3 py-2 rounded-full ${
                isConnected || item.id === '1'
                  ? 'bg-gray-800'
                  : 'bg-gray-800 opacity-50'
              }`}
              disabled={!isConnected && item.id !== '1'}
            >
              <FontAwesome6 name={item.icon as any} size={14} color={isConnected ? '#00F0FF' : '#9CA3AF'} />
              <Text className="text-gray-300 text-xs ml-1">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
