import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { cn } from "@/lib/utils";
  import { toast } from "sonner";
  import { z } from "zod";
  import {
    ToolCallContentPartProps,
    useAssistantTool,
  } from "@assistant-ui/react";
  // TODO: Implement and create '@/actions/check-price' server action
  
  // Schema for the tool arguments
  export const priceCheckSchema = z.object({
    query: z.string().min(2, "Please enter a medical condition, treatment, or medication."),
    isInNetwork: z.boolean(),
    deductibleSpent: z.number().min(0),
    outOfPocketSpent: z.number().min(0),
  });
  
  // Result type
  export type PriceCheckResult = {
    name: string;
    estimatedCost: number;
    details: string;
  };
  
  // Specific Tool Display Components
  const PriceCheckDisplay = ({ status, result }: ToolCallContentPartProps<z.infer<typeof priceCheckSchema>, { results: PriceCheckResult[] }>) => {
    const results = result?.results;
    return (
      <div
        className={cn(
          "flex flex-col min-h-[68px] gap-3 rounded-md border-2 bg-muted/50 p-3 transition-all duration-300 hover:bg-muted/70 hover:shadow-md w-full",
          status.type === "running" || status.type === "requires-action"
            ? "border-blue-400 hover:border-blue-500"
            : status.type === "incomplete"
              ? "border-destructive hover:border-destructive/80"
              : "border-green-400 hover:border-green-500"
        )}
      >
        {status.type === "running" && <span className="text-blue-500">Checking price...</span>}
        {status.type === "complete" && (!results || results.length === 0) && (
          <span>No price information found.</span>
        )}
        {status.type === "complete" && results && results.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>${r.estimatedCost.toLocaleString()}</TableCell>
                  <TableCell>{r.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };
  
  export const SetPriceCheckToolUI = () => {
    useAssistantTool({
      toolName: "priceCheck",
      description: "Check the price of a medical condition, treatment, or medication.",
      execute: async (args) => {
        try {
          // @ts-expect-error: checkPrice will be implemented
          const res = await (await import("@/actions/check-price")).checkPrice(args);
          toast.success("Price check complete");
          return res;
        } catch (e: unknown) {
          const error = e as Error;
          toast.error(error.message || "Failed to check price");
          throw error;
        }
      },
      render: (props) => <PriceCheckDisplay {...props} />,
      parameters: priceCheckSchema,
      // NOTE: To add a loader to the button, integrate with the form/button in the parent UI if needed.
    });
    return null;
  };
  