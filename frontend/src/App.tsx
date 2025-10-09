import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Overview from "@/app/dashboard/overview";
import Andon from "@/app/dashboard/andon";
import Historical from "./app/signal/historical";
import RecentCondition from "./app/signal/recent-condition";
import DeviceSetup from "@/app/configuration/device-setup";
import UserAccess from "./app/configuration/user-acccess";
import LoginPage from "./app/login/page";
import { Toaster } from "@/components/ui/sonner";
import type { ReactElement } from "react";

function ProtectedRoute({
	children,
}: {
	children: ReactElement;
}): ReactElement {
	const user = localStorage.getItem("user");
	if (!user) {
		return <Navigate to="/login" replace />;
	}
	return children;
}

function PublicRoute({ children }: { children: ReactElement }): ReactElement {
	const user = localStorage.getItem("user");
	if (user) {
		return <Navigate to="/andon" replace />;
	}
	return children;
}

function RootRedirect(): ReactElement {
	const user = localStorage.getItem("user");
	return user ? (
		<Navigate to="/andon" replace />
	) : (
		<Navigate to="/login" replace />
	);
}

function App(): ReactElement {
	return (
		<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
			<Toaster position="top-center" />
			<Routes>
				<Route path="/" element={<RootRedirect />} />
				<Route
					path="login"
					element={
						<PublicRoute>
							<LoginPage />
						</PublicRoute>
					}
				/>
				<Route
					path="overview"
					element={
						<ProtectedRoute>
							<Overview />
						</ProtectedRoute>
					}
				/>
				<Route
					path="andon"
					element={
						<ProtectedRoute>
							<Andon />
						</ProtectedRoute>
					}
				/>
				<Route
					path="historical-logs"
					element={
						<ProtectedRoute>
							<Historical />
						</ProtectedRoute>
					}
				/>
				<Route
					path="recent-condition"
					element={
						<ProtectedRoute>
							<RecentCondition />
						</ProtectedRoute>
					}
				/>
				<Route
					path="device-setup"
					element={
						<ProtectedRoute>
							<DeviceSetup />
						</ProtectedRoute>
					}
				/>
				<Route
					path="user-access"
					element={
						<ProtectedRoute>
							<UserAccess />
						</ProtectedRoute>
					}
				/>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</ThemeProvider>
	);
}

export default App;
