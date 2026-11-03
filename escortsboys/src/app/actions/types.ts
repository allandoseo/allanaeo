import type { FieldErrors } from '@/lib/validation';

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  /** Valores reenviados ao formulário após erro (nunca inclui senhas). */
  values?: Record<string, string>;
  /** Somente em desenvolvimento: link gerado sem serviço de e-mail. */
  devLink?: string;
}
