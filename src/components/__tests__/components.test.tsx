import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppNotificationCard } from '../AppNotificationCard';
import { Avatar, getInitials } from '../Avatar';
import { NotificationCard, removalLabel } from '../NotificationCard';
import { NotificationFeedCard } from '../NotificationFeedCard';
import { EmptyState } from '../states';
import { Segmented } from '../ui';
import { rec } from '@/testing/fixtures';

jest.mock('@/hooks/useAppIcon', () => ({ useAppIcon: () => null }));

const NOW = new Date(2026, 9, 31, 12, 5).getTime();

describe('Avatar', () => {
  it('computes initials correctly', () => {
    expect(getInitials('Laura')).toBe('LA');
    expect(getInitials('Alex Carter')).toBe('AC');
    expect(getInitials('')).toBe('?');
  });

  it('renders initials badge with contact name', async () => {
    await render(<Avatar name="Laura" size={46} />);
    expect(screen.getByText('LA')).toBeTruthy();
  });
});

describe('NotificationFeedCard', () => {
  it('renders contact avatar, title, body, and handles press', async () => {
    const onPress = jest.fn();
    const onReply = jest.fn();
    const item = rec({
      title: 'Alex Carter',
      text: 'I can pick you up on the way',
      appName: 'WhatsApp',
      packageName: 'com.whatsapp',
      postedAt: NOW - 60_000,
    });
    await render(<NotificationFeedCard item={item} now={NOW} onPress={onPress} onReply={onReply} />);
    expect(screen.getByText('Alex Carter')).toBeTruthy();
    expect(screen.getByText('I can pick you up on the way')).toBeTruthy();
    expect(screen.getByText('Quick Reply')).toBeTruthy();

    await fireEvent.press(screen.getByText('Quick Reply'));
    expect(onReply).toHaveBeenCalledWith(item);
  });

  it('renders deleted banner when message is deleted', async () => {
    const item = rec({
      title: 'Alex Carter',
      text: 'Deleted text',
      isDeleted: true,
      deletedAt: NOW - 30_000,
      appName: 'WhatsApp',
      packageName: 'com.whatsapp',
    });
    await render(<NotificationFeedCard item={item} now={NOW} onPress={jest.fn()} />);
    expect(screen.getByText(/Deleted by sender · Recovered/)).toBeTruthy();
  });
});

describe('AppNotificationCard', () => {
  it('renders app group with items and triggers interactions', async () => {
    const onPress = jest.fn();
    const onOpenMenu = jest.fn();
    const group = {
      packageName: 'com.whatsapp',
      appName: 'WhatsApp',
      lastPostedAt: NOW - 14_000,
      items: [
        rec({ title: 'CSE -65(B) - Personal', text: '~ Ri.Duu : dibi?', packageName: 'com.whatsapp' }),
        rec({ title: 'CSE -65(B) - Personal', text: '~ Arpita Das : Amr', packageName: 'com.whatsapp' }),
      ],
    };

    await render(
      <AppNotificationCard
        group={group}
        now={NOW}
        onPress={onPress}
        onOpenMenu={onOpenMenu}
      />,
    );

    expect(screen.getByText('WhatsApp')).toBeTruthy();
    expect(screen.getAllByText('CSE -65(B) - Personal').length).toBe(2);
    expect(screen.getByText('~ Ri.Duu : dibi?')).toBeTruthy();
    expect(screen.getByText('~ Arpita Das : Amr')).toBeTruthy();
  });
});

describe('NotificationCard', () => {
  it('shows content, exposes an accessible label and handles press/long-press', async () => {
    const onPress = jest.fn();
    const onLong = jest.fn();
    const item = rec({ title: 'Ana', text: 'Lunch?', appName: 'Chat', isFavorite: true, postedAt: NOW - 120_000, removedAt: NOW, removalReason: 2 });
    await render(<NotificationCard item={item} now={NOW} onPress={onPress} onLongPress={onLong} />);
    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('Dismissed on device')).toBeTruthy();
    const btn = screen.getByRole('button', { name: /Chat, Ana, Lunch\?.*favourite/ });
    await fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledWith(item);
    await fireEvent(btn, 'longPress');
    expect(onLong).toHaveBeenCalledWith(item);
  });

  it('falls back to the app name when the title is missing', async () => {
    await render(<NotificationCard item={rec({ title: null, text: null, appName: 'Mail' })} now={NOW} onPress={jest.fn()} />);
    expect(screen.getAllByText('Mail').length).toBeGreaterThan(0);
  });

  it('shows deleted badge and media preview when notification is deleted', async () => {
    const item = rec({ title: 'Bob', text: 'Secret message', isDeleted: true, mediaPath: '/path/to/img.jpg' });
    await render(<NotificationCard item={item} now={NOW} onPress={jest.fn()} />);
    expect(screen.getByText('Deleted by sender')).toBeTruthy();
    expect(screen.getByText('Secret message')).toBeTruthy();
  });

  it('labels removal reasons', () => {
    expect(removalLabel(1)).toMatch(/Opened/);
    expect(removalLabel(8)).toMatch(/Cleared by app/);
    expect(removalLabel(null)).toMatch(/Removed/);
  });
});

describe('shared UI', () => {
  it('renders empty states with an action', async () => {
    const onAction = jest.fn();
    await render(<EmptyState icon="notifications-outline" title="Nothing here" message="Try later" actionLabel="Retry" onAction={onAction} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('segmented control reports the chosen value', async () => {
    const onChange = jest.fn();
    await render(<Segmented value="a" onChange={onChange} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
