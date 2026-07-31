import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuestionItem } from "@/modules/search-knowledge/types";
import { STATUS_COLORS } from "@/modules/search-knowledge/constants";

interface QuestionsSectionProps {
  data: QuestionItem[] | undefined;
  isLoading: boolean;
}

export function QuestionsSection({ data, isLoading }: QuestionsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const questions = data ?? [];

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No question data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <Card key={q.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                {q.intent}
              </Badge>
              <h3 className="text-sm font-medium mb-1">{q.question}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{q.answer}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">Volume</div>
              <div className="text-sm font-semibold">{q.searchVolume.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
            Topic: {q.topic}
          </div>
        </Card>
      ))}
    </div>
  );
}