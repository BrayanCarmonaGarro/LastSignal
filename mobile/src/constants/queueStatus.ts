import type { PhotoStatus } from '@/services/offline/queue';

export type StatusConfig = {
  icon: string;
  label: string;
  colorKey: 'primaryLight' | 'oxygen' | 'success' | 'danger';
};

export const STATUS_CONFIG: Record<PhotoStatus, StatusConfig> = {
  pending:   { icon: 'time-outline',            label: 'En espera',     colorKey: 'primaryLight' },
  uploading: { icon: 'cloud-upload-outline',    label: 'Subiendo...',   colorKey: 'oxygen' },
  analyzing: { icon: 'eye-outline',             label: 'Analizando...', colorKey: 'oxygen' },
  saving:    { icon: 'save-outline',            label: 'Guardando...',  colorKey: 'oxygen' },
  done:      { icon: 'checkmark-circle-outline',label: 'Sincronizado',  colorKey: 'success' },
  error:     { icon: 'alert-circle-outline',    label: 'Error',         colorKey: 'danger' },
};
