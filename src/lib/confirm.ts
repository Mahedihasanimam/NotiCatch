import { showAppConfirm } from '@/components/CustomDialog';

export function confirm(opts: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}): void {
  showAppConfirm(
    opts.title,
    opts.message,
    opts.onConfirm,
    opts.destructive ?? false,
    opts.confirmLabel,
    'Cancel',
  );
}
