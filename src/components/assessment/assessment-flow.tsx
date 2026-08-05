"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ASSESSMENT_QUESTIONS, SCALE_LABELS } from "@/data/questions";
import { ASSESSMENT_DIMENSIONS, ASSESSMENT_DIMENSION_LABELS } from "@/types/assessment";
import { isAnswersComplete } from "@/lib/scoring";
import {
  saveAuthenticatedAssessment,
  saveGuestAssessment,
  type GuestContact,
} from "@/app/assessment/actions";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContactGate } from "./contact-gate";
import { RESULT_STORAGE_KEY, type StoredResult } from "./assessment-result-view";

const STORAGE_KEY = "adoptioncockpit_assessment_answers";

type Step = "questions" | "gate";

interface AssessmentFlowProps {
  isAuthenticated: boolean;
}

export function AssessmentFlow({ isAuthenticated }: AssessmentFlowProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [restored, setRestored] = useState(false);
  const [step, setStep] = useState<Step>("questions");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Antworten aus einem vorherigen Durchlauf wiederherstellen (z. B. nach
  // Redirect zu /login oder /register und zurück).
  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // Einmaliges Wiederherstellen von sessionStorage nach Hydration,
        // damit Server- und Client-Render beim ersten Paint übereinstimmen.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers(JSON.parse(stored) as Record<string, number>);
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setRestored(true);
  }, []);

  // Ist der Nutzer nach dem Wiederherstellen bereits angemeldet und alle
  // Fragen beantwortet, direkt speichern statt erneut das Gate zu zeigen.
  useEffect(() => {
    if (!restored || !isAuthenticated) return;
    if (isAnswersComplete(answers)) {
      submitAuthenticated(answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored, isAuthenticated]);

  function submitAuthenticated(currentAnswers: Record<string, number>) {
    setError(null);
    startTransition(async () => {
      const res = await saveAuthenticatedAssessment(currentAnswers);
      if (res.error || !res.data) {
        setError(res.error ?? "Etwas ist schiefgelaufen. Bitte versuche es erneut.");
        return;
      }
      window.sessionStorage.removeItem(STORAGE_KEY);
      router.push(`/assessment/result?id=${res.data.id}`);
    });
  }

  function handleAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleContinue() {
    if (!isAnswersComplete(answers)) {
      setError("Bitte beantworte alle Fragen, bevor du fortfährst.");
      return;
    }
    setError(null);

    if (isAuthenticated) {
      submitAuthenticated(answers);
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    setStep("gate");
  }

  function handleGuestSubmit(contact: GuestContact) {
    setError(null);
    startTransition(async () => {
      const res = await saveGuestAssessment(answers, contact);
      if (res.error || !res.data) {
        setError(res.error ?? "Etwas ist schiefgelaufen. Bitte versuche es erneut.");
        return;
      }
      window.sessionStorage.removeItem(STORAGE_KEY);
      // Gäste können ihr Ergebnis nicht per RLS aus der DB nachladen -
      // deshalb wird es für die Ergebnis-Seite kurzzeitig zwischengelegt.
      const storedResult: StoredResult = {
        totalScore: res.data.totalScore,
        scores: res.data.scores,
        companyName: contact.companyName,
      };
      window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(storedResult));
      router.push("/assessment/result");
    });
  }

  if (step === "gate") {
    return (
      <ContactGate
        onSubmitGuest={handleGuestSubmit}
        isPending={isPending}
        error={error}
      />
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          KI-Readiness-Assessment
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {answeredCount} von {ASSESSMENT_QUESTIONS.length} Fragen beantwortet
        </p>
      </div>

      {ASSESSMENT_DIMENSIONS.map((dimension) => (
        <section key={dimension} className="flex flex-col gap-6">
          <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
            {ASSESSMENT_DIMENSION_LABELS[dimension]}
          </h2>
          {ASSESSMENT_QUESTIONS.filter((q) => q.dimension === dimension).map(
            (question) => (
              <div key={question.id} className="flex flex-col gap-3">
                <p className="text-sm text-zinc-800 dark:text-zinc-200">
                  {question.text}
                </p>
                <RadioGroup
                  value={answers[question.id]?.toString() ?? ""}
                  onValueChange={(value) =>
                    handleAnswer(question.id, Number(value))
                  }
                  className="grid grid-cols-5 gap-2"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label
                      key={value}
                      htmlFor={`${question.id}_${value}`}
                      className="flex flex-col items-center gap-1.5 text-center"
                    >
                      <RadioGroupItem
                        id={`${question.id}_${value}`}
                        value={value.toString()}
                      />
                      <span className="hidden text-[11px] leading-tight text-zinc-500 sm:block dark:text-zinc-500">
                        {value === 1 || value === 5 ? SCALE_LABELS[value] : value}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            ),
          )}
        </section>
      ))}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button size="lg" onClick={handleContinue} disabled={isPending}>
        {isPending ? "Wird gespeichert…" : "Auswertung anzeigen"}
      </Button>
    </div>
  );
}
