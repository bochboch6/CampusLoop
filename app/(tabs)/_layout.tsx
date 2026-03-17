// This group is kept as a simple passthrough (no tab bar).
// The index screen handles auth redirect; all other screens live at the root level.
import { Slot } from 'expo-router';

export default function TabsLayout() {
  return <Slot />;
}
