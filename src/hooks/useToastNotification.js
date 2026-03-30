import { useToast } from "../hooks/use-toast";

export function useToastNotification() {
  const { toast } = useToast();

  const showSuccess = (title, description) => {
    toast({
      title,
      description,
      variant: "default",
    });
  };

  const showError = (title, description) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  const showInfo = (title, description) => {
    toast({
      title,
      description,
      variant: "default",
    });
  };

  return { showSuccess, showError, showInfo };
}
