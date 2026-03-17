import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useApp } from '@/src/context/AppContext';

export default function Index() {
  const { state } = useApp();

  useEffect(() => {
    async function check() {
      await AsyncStorage.removeItem('campus_loop_onboarding_seen');
      const onboardingSeen = await AsyncStorage.getItem('campus_loop_onboarding_seen');
      if (!onboardingSeen) {
        router.replace('/onboarding');
      } else if (state.user && state.isLoggedIn) {
        router.replace('/map');
      } else {
        router.replace('/login');
      }
    }
    check();
  }, []);

  return null;
}
