import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/react";
import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export const FormField = ({ label, error, children }: FormFieldProps) => {
  return (
    <FormControl isInvalid={Boolean(error)}>
      <FormLabel fontSize={{ base: "9px", md: "15px", lg: "15px" }}>
        {label}
      </FormLabel>

      {children}

      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};