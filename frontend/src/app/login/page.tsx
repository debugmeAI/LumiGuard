import { IconAlignBoxRightStretch } from "@tabler/icons-react";
import { LoginForm } from "@/components/login-form";
import background from "@/assets/background.jpg";
import { ModeToggle } from "@/components/mode-toggle";

export default function LoginPage() {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="relative flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<a href="#" className="flex items-center gap-2 font-medium">
						<IconAlignBoxRightStretch className="size-6" />
						<span className="text-base font-bold">LumiGuard</span>
						<span className="text-xs text-muted-foreground">
							/ˈluː.mi.ɡɑːrd/
						</span>
					</a>
					<ModeToggle />
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<LoginForm />
					</div>
				</div>

				<footer className="absolute bottom-10 left-0 right-0 text-center text-sm text-muted-foreground">
					<p>
						© {new Date().getFullYear()} PT. SMT Indonesia | All
						rights reserved
					</p>
				</footer>
			</div>
			<div className="bg-muted relative hidden lg:block">
				<img
					src={background}
					alt="Background"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8] dark:grayscale"
				/>
			</div>
		</div>
	);
}
