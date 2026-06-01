import type { Route } from "./+types/login";
import { Box, Button, TextField, Typography, Container } from "@mui/material";
import { useNavigate } from "react-router";

export default function Login() {
	const navigate = useNavigate();

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		// Mock authentication
		navigate("/onboarding");
	};

	return (
		<Container maxWidth="xs">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 3,
				}}
			>
				<Typography variant="h4" component="h1">
					Welcome Back
				</Typography>
				<Box
					component="form"
					onSubmit={handleLogin}
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 2,
						width: "100%",
					}}
				>
					<TextField
						label="Email"
						fullWidth
						required
						type="email"
					/>
					<TextField
						label="Password"
						fullWidth
						required
						type="password"
					/>
					<Button
						type="submit"
						variant="contained"
						fullWidth
						size="large"
					>
						Sign In
					</Button>
				</Box>
			</Box>
		</Container>
	);
}
