import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { login, clearError } from '../store/slices/authSlice';
import type { LoginForm } from '../types';
import { theme } from '../styles/GlobalStyles';

// Styled components matching Ainur's login page design
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  padding: 40px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const LogoText = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${theme.colors.primary};
  margin: 0;
`;

const LogoSubtext = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  margin-top: 4px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  padding-right: ${props => props.type === 'password' || props.type === 'text' ? '44px' : '16px'};
  border: 2px solid ${props => props.hasError ? theme.colors.danger : theme.colors.border};
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s ease;
  background: ${theme.colors.white};

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? theme.colors.danger : theme.colors.primary};
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  padding: 4px;
  color: ${theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${theme.colors.textSecondary};
  }
`;

const ErrorMessage = styled.span`
  color: ${theme.colors.danger};
  font-size: 13px;
`;

const GlobalError = styled.div`
  background: ${theme.colors.dangerLight};
  border: 1px solid ${theme.colors.danger};
  color: ${theme.colors.danger};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
`;

const SubmitButton = styled.button<{ isLoading?: boolean }>`
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: ${props => props.isLoading ? 0.7 : 1};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const ForgotPassword = styled.a`
  text-align: center;
  color: ${theme.colors.primary};
  font-size: 14px;
  margin-top: 8px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  font-size: 13px;
`;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    dispatch(clearError());
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      navigate('/pos');
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <LogoText>AinurPOS</LogoText>
          <LogoSubtext>Система управління продажами</LogoSubtext>
        </Logo>

        <Form onSubmit={handleSubmit(onSubmit)}>
          {error && <GlobalError>{error}</GlobalError>}

          <FormGroup>
            <Label htmlFor="login">Email</Label>
            <InputWrapper>
              <Input
                id="login"
                type="email"
                placeholder="your@email.com"
                hasError={!!errors.login}
                {...register('login', {
                  required: 'Email є обов\'язковим',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Невірний формат email',
                  },
                })}
              />
            </InputWrapper>
            {errors.login && <ErrorMessage>{errors.login.message}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Пароль</Label>
            <InputWrapper>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Введіть пароль"
                hasError={!!errors.password}
                {...register('password', {
                  required: 'Пароль є обов\'язковим',
                  minLength: {
                    value: 6,
                    message: 'Пароль має бути не менше 6 символів',
                  },
                })}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </InputWrapper>
            {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
          </FormGroup>

          <SubmitButton type="submit" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="spin" />
                Входимо...
              </>
            ) : (
              'Увійти'
            )}
          </SubmitButton>

          <ForgotPassword>Забули пароль?</ForgotPassword>
        </Form>

        <Footer>
          © 2024 AinurPOS Clone. Всі права захищені.
        </Footer>
      </LoginCard>
    </LoginContainer>
  );
}
