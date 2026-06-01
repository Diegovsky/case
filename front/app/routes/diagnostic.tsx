import type { Route } from "./+types/diagnostic";
import { Box, Typography, Container, Button } from "@mui/material";
import { useNavigate } from "react-router";

export default function Diagnostic() {
	const navigate = useNavigate();

	return (
		<Container maxWidth="md">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 3,
					textAlign: "center",
				}}
			>
				<Typography variant="h4" component="h1">
					Diagnostic Exam
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Answer a few questions to establish your baseline proficiency.
				</Typography>
				<Button
					variant="contained"
					size="large"
					onClick={() => navigate("/")}
				>
					Start Exam
				</Button>
			</Box>
		</Container>
	);
}
