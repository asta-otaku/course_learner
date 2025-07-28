import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordEmailSchema } from "@/lib/schema";
import { z } from "zod";
import { Loader2 } from "lucide-react";

interface ForgetPasswordProps {
  onNext: (email: string) => void;
  isPending: boolean;
}

export default function ForgetPassword({
  onNext,
  isPending,
}: ForgetPasswordProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof forgotPasswordEmailSchema>>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });

  return (
    <form
      className="max-w-xl w-full mx-auto flex flex-col gap-2"
      onSubmit={handleSubmit((data) => onNext(data.email))}
    >
      <div className="flex flex-col gap-1">
        <label className="font-medium">Email Address</label>
        <Input
          {...register("email")}
          type="email"
          className="!rounded-xl !h-11 placeholder:text-textSubtitle"
          placeholder="johndoe@example.com"
        />
        {errors.email && (
          <span className="text-red-500 text-xs">{errors.email.message}</span>
        )}
      </div>
      <Button
        type="submit"
        className="w-full flex gap-2 mt-12 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
      </Button>
    </form>
  );
}
