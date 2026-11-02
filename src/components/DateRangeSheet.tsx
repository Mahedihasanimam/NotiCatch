import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { addDays, startOfDay } from '@/lib/time';
import { MIN_TOUCH, radius, space, useTheme } from '@/theme';
import { Sheet } from './Sheet';
import { Button, Chip, Text } from './ui';

export interface DateRange { from: number | null; to: number | null; label: string }
export const ANY_TIME: DateRange = { from: null, to: null, label: 'Any date' };

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function monthMatrix(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array<null>(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

const fmt = (ts: number) => new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });

export function DateRangeSheet({ visible, onClose, onApply }: { visible: boolean; onClose: () => void; onApply: (r: DateRange) => void }) {
  const { colors } = useTheme();
  const today = startOfDay(Date.now());
  const [view, setView] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const cells = useMemo(() => monthMatrix(view.y, view.m), [view]);

  const pick = (day: number) => {
    const ts = new Date(view.y, view.m, day).getTime();
    if (ts > today) return;
    if (start === null || end !== null) { setStart(ts); setEnd(null); }
    else if (ts < start) { setEnd(start); setStart(ts); }
    else setEnd(ts);
  };

  const shift = (delta: number) => setView((v) => { const d = new Date(v.y, v.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const preset = (label: string, days: number) => () => { onApply({ from: addDays(today, -(days - 1)), to: addDays(today, 1), label }); onClose(); };
  const apply = () => {
    if (start === null) return;
    const last = end ?? start;
    onApply({ from: start, to: addDays(last, 1), label: end === null || end === start ? fmt(start) : `${fmt(start)} – ${fmt(end)}` });
    onClose();
  };
  const monthTitle = new Date(view.y, view.m, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });

  return (
    <Sheet visible={visible} title="Filter by date" onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Chip label="Any date" onPress={() => { onApply(ANY_TIME); onClose(); }} />
          <Chip label="Today" onPress={preset('Today', 1)} />
          <Chip label="Last 7 days" onPress={preset('Last 7 days', 7)} />
          <Chip label="Last 30 days" onPress={preset('Last 30 days', 30)} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shift(-1)} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text variant="heading" style={{ flex: 1, textAlign: 'center' }} accessibilityLiveRegion="polite">{monthTitle}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shift(1)} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {WEEK.map((w, i) => <Text key={i} variant="caption" muted style={{ flex: 1, textAlign: 'center' }}>{w}</Text>)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
            const ts = new Date(view.y, view.m, day).getTime();
            const future = ts > today;
            const lo = start, hi = end ?? start;
            const inRange = lo !== null && hi !== null && ts >= Math.min(lo, hi) && ts <= Math.max(lo, hi);
            const edge = ts === start || ts === end;
            return (
              <Pressable
                key={day} disabled={future} onPress={() => pick(day)} accessibilityRole="button"
                accessibilityLabel={new Date(ts).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                accessibilityState={{ selected: inRange, disabled: future }}
                style={{ width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: edge ? colors.primary : inRange ? colors.primarySoft : 'transparent', borderWidth: ts === today && !edge ? 1.5 : 0, borderColor: colors.primary }}>
                  <Text variant="label" color={edge ? colors.onPrimary : future ? colors.border : colors.text}>{day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" muted style={{ textAlign: 'center' }}>
          {start === null ? 'Tap a day, then another to choose a range' : end === null ? `From ${fmt(start)} — tap an end day or apply for one day` : `${fmt(start)} – ${fmt(end)}`}
        </Text>
        <Button title="Apply range" onPress={apply} disabled={start === null} />
      </View>
    </Sheet>
  );
}
