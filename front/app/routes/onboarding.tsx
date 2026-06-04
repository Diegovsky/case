import type { Route } from "./+types/onboarding";
import {
	Box,
	Typography,
	Container,
	Button,
	Grid,
	Card,
	CardActionArea,
	CardContent,
	LinearProgress,
} from "@mui/material";
import { redirect, useNavigate } from "react-router";
import { useState } from "react";
import QuizCard from "~/components/QuizCard";
import { DIAGNOSTIC_QUESTIONS } from "~/data/diagnostic-questions";
import { userMePartialUpdate } from "~/client";
import { handleResponse } from "~/utils";

const INTERESTS = [
	"Sports",
	"Music",
	"Gaming",
	"Technology",
	"Cooking",
	"Art",
	"Science",
	"History",
	"Literature",
	"Cinema",
];

type OnboardingStep = "INTERESTS" | "DIAGNOSTIC";

export default function Onboarding({}: Route.ComponentProps) {
	const navigate = useNavigate();
	const [step, setStep] = useState<OnboardingStep>("INTERESTS");
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);

	const toggleInterest = (interest: string) => {
		setSelectedInterests((prev) =>
			prev.includes(interest)
				? prev.filter((i) => i !== interest)
				: [...prev, interest],
		);
	};

	const startDiagnostic = () => {
		if (selectedInterests.length === 0) return;
		setStep("DIAGNOSTIC");
	};

	const handleSubmitAnswer = async () => {
		if (currentIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			const data = {
				interests: selectedInterests,
			};
			handleResponse(
				await userMePartialUpdate({
					body: { progress: data },
				}),
			);
			navigate("/");
		}
	};

	const diagnosticProgress = (currentIndex / DIAGNOSTIC_QUESTIONS.length) * 100;

	return (
		<Container maxWidth="md">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 4,
					textAlign: "center",
				}}
			>
				{step === "INTERESTS" && (
					<Box
						sx={{
							width: "100%",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 4,
						}}
					>
						<Box>
							<Typography variant="h4" component="h1" gutterBottom>
								Let's get to know you
							</Typography>
							<Typography variant="body1" color="text.secondary">
								Select the topics that interest you most. We'll use these to
								personalize your math examples!
							</Typography>
						</Box>

						<Grid container spacing={2} sx={{ width: "100%" }}>
							{INTERESTS.map((interest) => (
								<Grid size={{ xs: 6, sm: 4, md: 3 }} key={interest}>
									<Card
										variant="outlined"
										sx={{
											borderColor: selectedInterests.includes(interest)
												? "primary.main"
												: "divider",
											borderWidth: selectedInterests.includes(interest) ? 2 : 1,
											transition: "all 0.2s",
										}}
									>
										<CardActionArea onClick={() => toggleInterest(interest)}>
											<CardContent>
												<Typography
													variant="body1"
													sx={{
														fontWeight: selectedInterests.includes(interest)
															? "bold"
															: "normal",
														color: selectedInterests.includes(interest)
															? "primary.main"
															: "text.primary",
													}}
												>
													{interest}
												</Typography>
											</CardContent>
										</CardActionArea>
									</Card>
								</Grid>
							))}
						</Grid>

						<Button
							variant="contained"
							size="large"
							onClick={startDiagnostic}
							sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
						>
							Continue
						</Button>
					</Box>
				)}

				{step === "DIAGNOSTIC" && (
					<Box
						sx={{
							width: "100%",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 4,
						}}
					>
						<Box sx={{ width: "100%", maxWidth: 600, textAlign: "center" }}>
							<Typography variant="h4" component="h1" gutterBottom>
								Diagnostic Exam
							</Typography>
							<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
								Question {currentIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}
							</Typography>
							<LinearProgress
								variant="determinate"
								value={diagnosticProgress}
								sx={{ height: 10, borderRadius: 5 }}
							/>
						</Box>

						<QuizCard
							question={DIAGNOSTIC_QUESTIONS[currentIndex]}
							onSubmit={handleSubmitAnswer}
						/>
					</Box>
				)}
			</Box>
		</Container>
	);
}
