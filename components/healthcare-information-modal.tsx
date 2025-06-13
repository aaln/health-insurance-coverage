"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealthcareInformation } from "@/hooks/use-healthcare-information";
import { HealthcareInformationSchema, type HealthcareInformation, type PersonHealthInfo } from "@/types/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertTriangle,
    Calendar,
    Heart,
    Minus,
    Pill,
    Plus,
    Save,
    User,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

interface HealthcareInformationModalProps {
  children: React.ReactNode;
}

export function HealthcareInformationModal({ children }: HealthcareInformationModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { healthcareInfo, updateHealthcareInfo, summary, hasCompleteInfo } = useHealthcareInformation();
  
  const form = useForm<HealthcareInformation>({
    resolver: zodResolver(HealthcareInformationSchema),
    defaultValues: {
      members: healthcareInfo?.members || [
        {
          id: "primary",
          name: "Primary Member",
          age: 30,
          relationship: "self",
          preExistingConditions: [],
          currentMedications: [],
          allergies: [],
          expectedMedicalEvents: [],
          smoker: false,
          expectedUsage: "moderate",
        },
      ],
      lastUpdated: new Date(),
    },
  });

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;
  const membersArray = useFieldArray({ control, name: "members" });
  const watchedMembers = watch("members");

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && healthcareInfo) {
      reset(healthcareInfo);
    }
    setOpen(newOpen);
  };

  const addMember = () => {
    const newMember: PersonHealthInfo = {
      id: `member-${Date.now()}`,
      name: `Member ${membersArray.fields.length + 1}`,
      age: 25,
      relationship: "spouse",
      preExistingConditions: [],
      currentMedications: [],
      allergies: [],
      expectedMedicalEvents: [],
      smoker: false,
      expectedUsage: "moderate",
    };
    membersArray.append(newMember);
    setActiveTab(`member-${membersArray.fields.length - 1}`);
  };

  const removeMember = (index: number) => {
    if (membersArray.fields.length > 1) {
      membersArray.remove(index);
      setActiveTab("overview");
    }
  };

  const onSubmit = (data: HealthcareInformation) => {
    const success = updateHealthcareInfo(data);
    if (success) {
      setOpen(false);
    }
  };

  const addArrayItem = (memberIndex: number, fieldName: keyof PersonHealthInfo, value: string) => {
    if (!value.trim()) return;
    
    const currentValues = watchedMembers[memberIndex][fieldName] as string[];
    const newValues = [...currentValues, value.trim()];
    setValue(`members.${memberIndex}.${fieldName}` as const, newValues);
  };

  const removeArrayItem = (memberIndex: number, fieldName: keyof PersonHealthInfo, itemIndex: number) => {
    const currentValues = watchedMembers[memberIndex][fieldName] as string[];
    const newValues = currentValues.filter((_, i) => i !== itemIndex);
    setValue(`members.${memberIndex}.${fieldName}` as const, newValues);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[80vw] sm:w-[60vw] max-w-none p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Healthcare Information
            {hasCompleteInfo && (
              <Badge variant="outline" className="ml-2">
                {summary.memberCount} member{summary.memberCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Provide your household&apos;s healthcare information for personalized insurance analysis.
            This information is stored locally and used to enhance AI recommendations.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-3 border-b overflow-x-auto">
              <TabsList className="flex gap-1 w-max min-w-full">
                <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                {membersArray.fields.map((field, index) => (
                  <TabsTrigger key={field.id} value={`member-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                    <User className="h-4 w-4" />
                    Member {index + 1}
                    {index === 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">Primary</Badge>
                    )}
                  </TabsTrigger>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMember}
                  className="flex items-center gap-1 ml-2 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="overview" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Household Overview</CardTitle>
                      <CardDescription>
                        Summary of your household healthcare information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{summary.memberCount}</div>
                          <div className="text-sm text-blue-600">Members</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{summary.conditionsCount}</div>
                          <div className="text-sm text-red-600">Conditions</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{summary.medicationsCount}</div>
                          <div className="text-sm text-green-600">Medications</div>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{summary.allergiesCount}</div>
                          <div className="text-sm text-yellow-600">Allergies</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {membersArray.fields.map((field, memberIndex) => (
                  <TabsContent key={field.id} value={`member-${memberIndex}`} className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Member {memberIndex + 1}
                              {memberIndex === 0 && <span className="text-sm text-muted-foreground ml-2">(Primary)</span>}
                            </CardTitle>
                            <CardDescription>
                              Healthcare information for this family member
                            </CardDescription>
                          </div>
                          {memberIndex > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(memberIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Age</Label>
                            <Input
                              type="number"
                              {...register(`members.${memberIndex}.age`, { valueAsNumber: true })}
                              placeholder="30"
                            />
                          </div>
                          <div>
                            <Label>Expected Healthcare Usage</Label>
                            <Select
                              value={watchedMembers[memberIndex]?.expectedUsage}
                              onValueChange={(value) =>
                                setValue(`members.${memberIndex}.expectedUsage`, value as PersonHealthInfo['expectedUsage'])
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={watchedMembers[memberIndex]?.smoker || false}
                            onCheckedChange={(checked) =>
                              setValue(`members.${memberIndex}.smoker`, checked as boolean)
                            }
                          />
                          <Label>Current smoker</Label>
                        </div>

                        <Separator />

                        {/* Medical Arrays */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {/* Pre-existing Conditions */}
                          <MedicalArraySection
                            title="Pre-existing Conditions"
                            icon={<Heart className="h-4 w-4" />}
                            items={watchedMembers[memberIndex]?.preExistingConditions || []}
                            onAdd={(value) => addArrayItem(memberIndex, "preExistingConditions", value)}
                            onRemove={(index) => removeArrayItem(memberIndex, "preExistingConditions", index)}
                            placeholder="e.g., Diabetes, Hypertension"
                          />

                          {/* Current Medications */}
                          <MedicalArraySection
                            title="Current Medications"
                            icon={<Pill className="h-4 w-4" />}
                            items={watchedMembers[memberIndex]?.currentMedications || []}
                            onAdd={(value) => addArrayItem(memberIndex, "currentMedications", value)}
                            onRemove={(index) => removeArrayItem(memberIndex, "currentMedications", index)}
                            placeholder="e.g., Metformin 500mg, Lisinopril"
                          />

                          {/* Allergies */}
                          <MedicalArraySection
                            title="Allergies"
                            icon={<AlertTriangle className="h-4 w-4" />}
                            items={watchedMembers[memberIndex]?.allergies || []}
                            onAdd={(value) => addArrayItem(memberIndex, "allergies", value)}
                            onRemove={(index) => removeArrayItem(memberIndex, "allergies", index)}
                            placeholder="e.g., Penicillin, Shellfish"
                          />

                          {/* Expected Medical Visits */}
                          <MedicalArraySection
                            title="Visits Expected in Next Year"
                            icon={<Calendar className="h-4 w-4" />}
                            items={watchedMembers[memberIndex]?.expectedMedicalEvents || []}
                            onAdd={(value) => addArrayItem(memberIndex, "expectedMedicalEvents", value)}
                            onRemove={(index) => removeArrayItem(memberIndex, "expectedMedicalEvents", index)}
                            placeholder="e.g., Surgery, Specialists, Physical Therapy"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </div>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 p-6 pt-4 border-t bg-background">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Healthcare Information
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

interface MedicalArraySectionProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}

function MedicalArraySection({ title, icon, items, onAdd, onRemove, placeholder }: MedicalArraySectionProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </Label>
      
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" size="sm" onClick={handleAdd} disabled={!inputValue.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
            <span className="flex-1">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <Minus className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 