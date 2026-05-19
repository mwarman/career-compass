import { Info } from 'lucide-react';
import { JSX } from 'react';

import { Button } from '@/components/shadcn/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/shadcn/sheet';

export const About = (): JSX.Element => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">About this project</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>About Career Compass</SheetTitle>
          <SheetDescription>An AI-powered portfolio project</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div>
            This portfolio project demonstrates the capabilities of Career Compass, an AI-powered conversational
            assistant. It guides users through a focused, career-oriented conversation and provides insights based on AI
            analysis. The project showcases the use of Amazon Bedrock for conversational AI, inference, and producing
            structured JSON output. It serves as a practical example of how AI can be integrated into real-world
            applications to solve common problems with structured AI prompting, multi-phase conversations with phase
            completion detection, and structured data output synthesized from AI analysis of the complete conversation
            context.
          </div>
          <div>
            The project is available on GitHub, where you can find the source code and documentation. It includes
            instructions for getting started, system documentation, and examples of how to use the tool.
          </div>
          <div>
            For more information, visit the{' '}
            <a
              href="https://github.com/mwarman/career-compass"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              GitHub repository
            </a>
            .
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
