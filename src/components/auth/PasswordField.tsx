import { useState, type ChangeEventHandler, type ReactNode } from 'react'
import { Eye, EyeOff } from '../icons'

type Props = {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  id?: string
  name?: string
  /** Nhãn phía trên (đã gồm dấu * nếu cần) */
  label: ReactNode
}

/**
 * Ô mật khẩu + nút hiện/ẩn (eye / eye-off).
 * Dùng chung cho LoginModal & RegisterModal.
 */
export default function PasswordField({
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required,
  minLength,
  id,
  name,
  label,
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="password-field">
      <span className="field-label">{label}</span>
      <div className="password-input-wrap">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="password-input"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
        </button>
      </div>
    </label>
  )
}
