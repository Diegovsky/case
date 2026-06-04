import {
	Box,
	Button,
	Container,
	Link,
	TextField,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { data, redirect } from "react-router";
import { authLoginCreate, userCreate } from "~/client";
import Session from "~/session.server";
import { handleResponse } from "~/utils";
import type { Route } from "./+types/login";

export async function action({ request }: Route.ActionArgs) {
	{
		const session = await Session.fromRequest(request);

		const data: any = Object.fromEntries(await request.formData());
		const isSignUp = data.first_name !== undefined;

		if (isSignUp) {
			// create account if signing up
			handleResponse(await userCreate({ body: data }));
		}

		// Do login
		const jwt = handleResponse(
			await authLoginCreate({
				body: {
					email: data.email,
					password: data.password,
				},
				auth: () => null,
			}),
		);
		session.setTokens(jwt);
		console.log(jwt.user);

		// go to /onboarding if progress is undefined/null
		const route = "/"; //!jwt.user.progress ? "/onboarding" : "/";
		throw redirect(route, await session.commit());
	}
}
export async function loader({ request }: Route.LoaderArgs) {
	const ses = await Session.fromRequest(request);
	return data({}, await ses.delete());
}

export default function Login({}: Route.ComponentProps) {
	const [isSignUp, setIsSignUp] = useState(false);

	const handleAuth = async (e: React.SubmitEvent) => {};

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
					method="POST"
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
