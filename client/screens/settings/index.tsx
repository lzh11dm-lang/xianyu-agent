import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface BrowserSeat {
  id: string;
  name: string;
  remark: string;
  createdAt: string;
}

interface BitBrowserConfig {
  apiUrl: string;
  seats: BrowserSeat[];
}

interface XianGuanJiaConfig {
  enabled: boolean;
  appKey: string;
  apiSecret: string;
  shops: string[];
}

export default function Settings() {
  const router = useSafeRouter();
  
  // 比特浏览器配置
  const [bitBrowserApiUrl, setBitBrowserApiUrl] = useState('http://127.0.0.1:54345');
  const [seats, setSeats] = useState<BrowserSeat[]>([]);
  const [newSeatName, setNewSeatName] = useState('');
  const [newSeatRemark, setNewSeatRemark] = useState('');
  const [newSeatId, setNewSeatId] = useState(''); // 比特浏览器的窗口ID
  
  // 闲管家配置
  const [xianGuanJiaEnabled, setXianGuanJiaEnabled] = useState(false);
  const [xianGuanJiaAppKey, setXianGuanJiaAppKey] = useState('');
  const [xianGuanJiaApiSecret, setXianGuanJiaApiSecret] = useState('');
  
  // 加载状态
  const [loading, setLoading] = useState(false);

  // 加载配置
  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/config`);
      const data = await res.json();
      if (data.success) {
        setBitBrowserApiUrl(data.data.bitBrowser.apiUrl);
        setSeats(data.data.bitBrowser.seats);
        setXianGuanJiaEnabled(data.data.xianGuanJia.enabled);
        setXianGuanJiaAppKey(data.data.xianGuanJia.appKey || '');
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConfig();
  }, []);

  // 保存比特浏览器 API 地址
  const saveApiUrl = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/config/bitbrowser/api-url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl: bitBrowserApiUrl })
      });
      Alert.alert('提示', 'API 地址已保存');
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
  };

  // 添加席位
  const addSeatHandler = async () => {
    if (!newSeatName || !newSeatId) {
      Alert.alert('提示', '请填写席位名称和窗口ID');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/config/bitbrowser/seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newSeatName, 
          remark: newSeatRemark + (newSeatRemark ? ` (ID: ${newSeatId})` : `ID: ${newSeatId}`)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSeats([...seats, data.data]);
        setNewSeatName('');
        setNewSeatRemark('');
        setNewSeatId('');
        Alert.alert('提示', '席位添加成功');
      }
    } catch (error) {
      Alert.alert('错误', '添加失败');
    }
    setLoading(false);
  };

  // 删除席位
  const deleteSeat = async (id: string) => {
    Alert.alert('确认', '确定删除这个席位？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/v1/config/bitbrowser/seats/${id}`, {
              method: 'DELETE'
            });
            setSeats(seats.filter(s => s.id !== id));
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        }
      }
    ]);
  };

  // 验证席位
  const validateSeat = async (id: string, name: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/config/bitbrowser/seats/${id}/validate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('验证成功', `${name} 可以正常使用`);
      } else {
        Alert.alert('验证失败', data.message);
      }
    } catch (error) {
      Alert.alert('错误', '验证失败');
    }
    setLoading(false);
  };

  // 保存闲管家配置
  const saveXianGuanJia = async () => {
    setLoading(true);
    try {
      // 先保存密钥
      if (xianGuanJiaAppKey && xianGuanJiaApiSecret) {
        await fetch(`${API_BASE}/api/v1/config/xianguanjia/credentials`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            appKey: xianGuanJiaAppKey, 
            apiSecret: xianGuanJiaApiSecret 
          })
        });
      }
      
      // 设置启用状态
      await fetch(`${API_BASE}/api/v1/config/xianguanjia/enabled`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: xianGuanJiaEnabled })
      });
      
      Alert.alert('提示', '闲管家配置已保存');
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
    setLoading(false);
  };

  return (
    <Screen>
      <ScrollView style={styles.container}>
        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>设置</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ========== 比特浏览器配置 ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>比特浏览器配置</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>API 接口地址</Text>
            <TextInput
              style={styles.input}
              value={bitBrowserApiUrl}
              onChangeText={setBitBrowserApiUrl}
              placeholder="http://127.0.0.1:54345"
              placeholderTextColor="#6B7280"
            />
            <TouchableOpacity style={styles.btn} onPress={saveApiUrl}>
              <Text style={styles.btnText}>保存 API 地址</Text>
            </TouchableOpacity>
          </View>

          {/* 席位列表 */}
          <View style={styles.card}>
            <Text style={styles.label}>席位配置 (已添加 {seats.length} 个)</Text>
            <Text style={styles.hint}>席位 = 比特浏览器里的一个窗口（登录了闲鱼账号）</Text>
            
            {seats.map((seat) => (
              <View key={seat.id} style={styles.seatItem}>
                <View style={styles.seatInfo}>
                  <Text style={styles.seatName}>{seat.name}</Text>
                  <Text style={styles.seatRemark}>{seat.remark}</Text>
                </View>
                <View style={styles.seatActions}>
                  <TouchableOpacity 
                    style={[styles.smallBtn, styles.validateBtn]}
                    onPress={() => validateSeat(seat.id, seat.name)}
                  >
                    <Text style={styles.smallBtnText}>验证</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.smallBtn, styles.deleteBtn]}
                    onPress={() => deleteSeat(seat.id)}
                  >
                    <Text style={styles.smallBtnText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {/* 添加新席位 */}
            <View style={styles.addSeatForm}>
              <Text style={styles.subLabel}>添加新席位</Text>
              <TextInput
                style={styles.input}
                value={newSeatName}
                onChangeText={setNewSeatName}
                placeholder="席位名称（如：账号1）"
                placeholderTextColor="#6B7280"
              />
              <TextInput
                style={styles.input}
                value={newSeatId}
                onChangeText={setNewSeatId}
                placeholder="窗口 ID（在比特浏览器中复制）"
                placeholderTextColor="#6B7280"
              />
              <TextInput
                style={styles.input}
                value={newSeatRemark}
                onChangeText={setNewSeatRemark}
                placeholder="备注（可选）"
                placeholderTextColor="#6B7280"
              />
              <TouchableOpacity 
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={addSeatHandler}
                disabled={loading}
              >
                <Text style={styles.btnText}>+ 添加席位</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ========== 闲管家配置 ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>闲管家配置（可选）</Text>
          
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>启用闲管家 API</Text>
                <Text style={styles.hint}>开启后可解锁：改价、改库存、发货、订单管理</Text>
              </View>
              <Switch
                value={xianGuanJiaEnabled}
                onValueChange={setXianGuanJiaEnabled}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {xianGuanJiaEnabled && (
              <>
                <Text style={styles.label}>AppKey</Text>
                <TextInput
                  style={styles.input}
                  value={xianGuanJiaAppKey}
                  onChangeText={setXianGuanJiaAppKey}
                  placeholder="在闲管家开放平台获取"
                  placeholderTextColor="#6B7280"
                />
                
                <Text style={styles.label}>ApiSecret</Text>
                <TextInput
                  style={styles.input}
                  value={xianGuanJiaApiSecret}
                  onChangeText={setXianGuanJiaApiSecret}
                  placeholder="在闲管家开放平台获取"
                  placeholderTextColor="#6B7280"
                  secureTextEntry
                />
                
                <TouchableOpacity 
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={saveXianGuanJia}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>保存闲管家配置</Text>
                </TouchableOpacity>
                
                <Text style={styles.hint}>
                  如何获取：在闲管家开放平台 - 添加自研系统 - 创建应用后获取 AppKey 和 ApiSecret
                </Text>
              </>
            )}
          </View>
        </View>

        {/* 底部间距 */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0A0A0F',
  },
  backBtn: {
    color: '#00F0FF',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D3A',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  subLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  hint: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#0A0A0F',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  seatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  seatInfo: {
    flex: 1,
  },
  seatName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  seatRemark: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  seatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  validateBtn: {
    backgroundColor: '#059669',
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  smallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addSeatForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D2D3A',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
