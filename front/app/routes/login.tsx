import type { Route } from "./+types/login";
import {
	Box,
	Button,
	TextField,
	Typography,
	Container,
	Link,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useState } from "react";
import { authLoginCreate, userCreate } from "~/client";
import { handleResponse } from "~/utils";

export default function Login({}: Route.ComponentProps) {
	const navigate = useNavigate();
	const [isSignUp, setIsSignUp] = useState(false);

	const handleAuth = async (e: React.SubmitEvent) => {
		e.preventDefault();
		const data: any = Object.fromEntries(new FormData(e.target));
		if (isSignUp) {
			await userCreate({ body: data });
			await navigate("/onboarding");
		} else {
			const user = handleResponse(await authLoginCreate({ body: data })).user;
			console.log(user);
			if (!user.progress) {
				await navigate("/onboarding");
			} else {
				await navigate("/");
			}
		}
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
					{isSignUp ? "Create Account" : "Welcome Back"}
				</Typography>
				<Box
					component="form"
					onSubmit={handleAuth}
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 2,
						width: "100%",
					}}
				>
					{isSignUp && (
						<>
							<TextField
								name="first_name"
								label="First Name"
								fullWidth
								required
							/>
							<TextField
								name="last_name"
								label="Last Name"
								fullWidth
								required
							/>
						</>
					)}
					<TextField
						name="email"
						label="Email"
						fullWidth
						value="admin@email.com"
						required
						type="email"
					/>
					<TextField
						value="admin"
						name="password"
						label="Password"
						fullWidth
						required
						type="password"
					/>
					<Button type="submit" variant="contained" fullWidth size="large">
						{isSignUp ? "Sign Up" : "Sign In"}
					</Button>
				</Box>
				<Link
					component="button"
					variant="body2"
					onClick={() => setIsSignUp(!isSignUp)}
					sx={{ cursor: "pointer", textDecoration: "none" }}
				>
					{isSignUp
						? "Already have an account? Sign In"
						: "Don't have an account? Sign Up"}
				</Link>
			</Box>
		</Container>
	);
}
