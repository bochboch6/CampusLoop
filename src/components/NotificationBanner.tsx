import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { AppNotification } from '../utils/aiSimulation';
import { C } from '../constants/theme';

const TYPE_CFG = {
  info:    { borderColor: 'rgba(82,183,136,0.5)',  textColor: C.deepGreen,  labelColor: C.leafGreen,  label: 'INFO'    },
  warning: { borderColor: 'rgba(217,119,6,0.45)', textColor: '#92400E',    labelColor: '#D97706',    label: 'ALERTE'  },
  urgent:  { borderColor: 'rgba(220,38,38,0.45)', textColor: '#991B1B',    labelColor: '#EF4444',    label: 'URGENT'  },
};

interface Props {
  notifications: AppNotification[];
  onClose: () => void;
}

export default function NotificationBanner({ notifications, onClose }: Props) {
  if (!notifications.length) return null;

  const notif =
    notifications.find(n => n.type === 'urgent') ??
    notifications.find(n => n.type === 'warning') ??
    notifications[0];

  const cfg = TYPE_CFG[notif.type];

  return (
    <View style={[s.banner, { borderColor: cfg.borderColor }]}>
      <View style={[s.typePill, { borderColor: cfg.labelColor }]}>
        <Text style={[s.typeLabel, { color: cfg.labelColor }]}>{cfg.label}</Text>
      </View>
      <Text style={[s.msg, { color: cfg.textColor }]} numberOfLines={2}>
        {notif.message}
      </Text>
      {notifications.length > 1 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{notifications.length}</Text>
        </View>
      )}
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={[s.close, { color: cfg.textColor }]}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10,
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(248,244,227,0.95)',
    shadowColor: '#1B4332',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    gap: 10,
  },
  typePill:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  typeLabel:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  msg:        { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  badge:      { backgroundColor: C.leafGreen, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText:  { color: C.white, fontSize: 10, fontWeight: '800' },
  close:      { fontSize: 20, fontWeight: '700', lineHeight: 22 },
});
