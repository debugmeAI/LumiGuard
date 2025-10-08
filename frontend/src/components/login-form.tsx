import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const [showPassword, setShowPassword] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_BASE_URL}/auth/login`,
				{ username, password }
			);

			localStorage.setItem("user", JSON.stringify(response.data.user));
			localStorage.setItem("isLoggedIn", "true");

			toast.success("Login successful");
			navigate("/andon");
		} catch (err: unknown) {
			if (isAxiosError(err)) {
				console.error("Login error:", err);
				const message =
					err.response?.data?.error ||
					"Invalid username or password.";
				setError(message);
				toast.error(message);
			} else {
				console.error("Unexpected error:", err);
				setError("An unexpected error occurred.");
				toast.error("An unexpected error occurred.");
			}
		} finally {
			setLoading(false);
		}
		console.log(JSON.parse(localStorage.getItem("user") || "{}"));
		console.log(localStorage.getItem("isLoggedIn"));
	};

	return (
		<form
			onSubmit={handleLogin}
			className={cn("flex flex-col gap-6", className)}
			{...props}>
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="text-2xl font-bold">Login to your account</h1>
				<p className="text-muted-foreground text-sm text-balance">
					Enter your credentials to continue
				</p>
			</div>

			<div className="grid gap-6">
				<div className="grid gap-3">
					<Label htmlFor="username">Username</Label>
					<Input
						id="username"
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>

				<div className="grid gap-3">
					<Label htmlFor="password">Password</Label>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword((prev) => !prev)}
							className="absolute right-2 top-2 text-muted-foreground">
							{showPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
				</div>

				{error && (
					<p className="text-sm text-red-500 text-center">{error}</p>
				)}

				<Button type="submit" disabled={loading} className="w-full">
					{loading ? "Logging in..." : "Login"}
				</Button>
			</div>

			<footer className="text-center text-sm text-muted-foreground pb-6">
				<p>
					© {new Date().getFullYear()} LumiGuard. All rights reserved.
				</p>
			</footer>
		</form>
	);
}
