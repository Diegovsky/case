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
					body: data,
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
			></Box>
		</Container>
	);
}
