import { useState, FormEvent } from 'react';
import { sanitizeObject, isSafeInput } from '@/utils/security';

interface UseSecureFormOptions<T> {
  onSubmit: (data: T) => Promise<void>;
  initialValues: T;
  validate?: (data: T) => Record<string, string> | null;
}

export function useSecureForm<T extends Record<string, any>>({
  onSubmit,
  initialValues,
  validate
}: UseSecureFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validate input for XSS before updating state
    if (!isSafeInput(value)) {
      setErrors(prev => ({
        ...prev,
        [name]: 'Input contains potentially dangerous content'
      }));
      return;
    }

    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      // Sanitize all form data before submission
      const sanitizedData = sanitizeObject(values);
      await onSubmit(sanitizedData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'An error occurred while submitting the form'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setValues
  };
} 