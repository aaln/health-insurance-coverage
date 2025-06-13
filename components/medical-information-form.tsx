"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MedicalInformationSchema, type MedicalInformation } from "@/types/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Calendar, Heart, Pill, Plus, Trash2, User } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

interface MedicalInformationFormProps {
  onSubmit: (data: MedicalInformation) => void;
  onCancel?: () => void;
  initialData?: Partial<MedicalInformation>;
  isLoading?: boolean;
  className?: string;
}

export function MedicalInformationForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  className = "",
}: MedicalInformationFormProps) {
  const [activeSection, setActiveSection] = useState<string>("personal");

  const form = useForm<MedicalInformation>({
    resolver: zodResolver(MedicalInformationSchema),
    defaultValues: {
      primaryMember: {
        age: initialData?.primaryMember?.age || 30,
        sex: initialData?.primaryMember?.sex || "male",
      },
      dependents: initialData?.dependents || [],
      primaryMedicalInfo: {
        personId: "primary",
        preExistingConditions: [],
        currentMedications: [],
        allergies: [],
        recentMedicalEvents: [],
        smoker: false,
        expectedUsage: "moderate",
        ...initialData?.primaryMedicalInfo,
      },
      dependentMedicalInfo: initialData?.dependentMedicalInfo || [],
      annualIncome: initialData?.annualIncome || undefined,
      zipCode: initialData?.zipCode || "",
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Field arrays for dynamic sections
  const dependentsArray = useFieldArray({ control, name: "dependents" });
  const conditionsArray = useFieldArray({ control, name: "primaryMedicalInfo.preExistingConditions" });
  const medicationsArray = useFieldArray({ control, name: "primaryMedicalInfo.currentMedications" });
  const allergiesArray = useFieldArray({ control, name: "primaryMedicalInfo.allergies" });
  const eventsArray = useFieldArray({ control, name: "primaryMedicalInfo.recentMedicalEvents" });

  const watchedDependents = watch("dependents");

  const addDependent = () => {
    const newId = `dependent-${Date.now()}`;
    dependentsArray.append({
      id: newId,
      age: 25,
      sex: "male",
      relationship: "spouse",
    });
    
    // Add corresponding medical info
    const currentMedicalInfo = watch("dependentMedicalInfo");
    setValue("dependentMedicalInfo", [
      ...currentMedicalInfo,
      {
        personId: newId,
        preExistingConditions: [],
        currentMedications: [],
        allergies: [],
        recentMedicalEvents: [],
        smoker: false,
        expectedUsage: "moderate",
      },
    ]);
  };

  const removeDependent = (index: number) => {
    const dependentId = watchedDependents[index]?.id;
    dependentsArray.remove(index);
    
    // Remove corresponding medical info
    const currentMedicalInfo = watch("dependentMedicalInfo");
    setValue(
      "dependentMedicalInfo",
      currentMedicalInfo.filter((info) => info.personId !== dependentId)
    );
  };

  const handleFormSubmit = (data: MedicalInformation) => {
    console.log("Submitting medical information:", data);
    onSubmit(data);
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Medical Information
        </CardTitle>
        <CardDescription>
          Please provide your medical information for accurate cost estimates and policy analysis.
          All information is kept confidential and used only for insurance analysis.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Accordion type="single" value={activeSection} onValueChange={setActiveSection} className="w-full">
            
            {/* Personal Information Section */}
            <AccordionItem value="personal">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                  <Badge variant="secondary" className="ml-2">
                    {1 + watchedDependents.length} member{watchedDependents.length !== 0 ? "s" : ""}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {/* Primary Member */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="md:col-span-3 text-sm font-medium mb-2">Primary Member</div>
                  <div>
                    <Label htmlFor="primaryAge">Age</Label>
                    <Input
                      id="primaryAge"
                      type="number"
                      {...register("primaryMember.age", { valueAsNumber: true })}
                      className="h-8"
                    />
                    {errors.primaryMember?.age && (
                      <p className="text-sm text-destructive mt-1">{errors.primaryMember.age.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="primarySex">Sex</Label>
                    <Select
                      value={watch("primaryMember.sex")}
                      onValueChange={(value) => setValue("primaryMember.sex", value as "male" | "female")}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div>
                        <Label htmlFor="annualIncome">Annual Income</Label>
                        <Input
                          id="annualIncome"
                          type="number"
                          placeholder="$75,000"
                          {...register("annualIncome", { valueAsNumber: true })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          placeholder="12345"
                          {...register("zipCode")}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dependents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Dependents</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDependent}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Dependent
                    </Button>
                  </div>

                  {dependentsArray.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                      <div>
                        <Label htmlFor={`dependent-age-${index}`}>Age</Label>
                        <Input
                          id={`dependent-age-${index}`}
                          type="number"
                          {...register(`dependents.${index}.age`, { valueAsNumber: true })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`dependent-sex-${index}`}>Sex</Label>
                        <Select
                          value={watch(`dependents.${index}.sex`)}
                          onValueChange={(value) => setValue(`dependents.${index}.sex`, value as "male" | "female")}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`dependent-relationship-${index}`}>Relationship</Label>
                        <Select
                          value={watch(`dependents.${index}.relationship`)}
                          onValueChange={(value) => setValue(`dependents.${index}.relationship`, value as "spouse" | "child" | "domestic_partner")}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="domestic_partner">Domestic Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDependent(index)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Medical History Section */}
            <AccordionItem value="medical">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Medical History (Primary Member)
                  <Badge variant="secondary" className="ml-2">
                    {conditionsArray.fields.length + medicationsArray.fields.length + allergiesArray.fields.length + eventsArray.fields.length} items
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6">
                
                {/* General Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smoker"
                      checked={watch("primaryMedicalInfo.smoker")}
                      onCheckedChange={(checked) => setValue("primaryMedicalInfo.smoker", checked as boolean)}
                    />
                    <Label htmlFor="smoker">Current smoker</Label>
                  </div>
                  <div>
                    <Label htmlFor="expectedUsage">Expected Healthcare Usage</Label>
                    <Select
                      value={watch("primaryMedicalInfo.expectedUsage")}
                      onValueChange={(value) => setValue("primaryMedicalInfo.expectedUsage", value as "low" | "moderate" | "high")}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Rarely visit doctors)</SelectItem>
                        <SelectItem value="moderate">Moderate (Occasional visits)</SelectItem>
                        <SelectItem value="high">High (Frequent medical care)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Pre-existing Conditions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Pre-existing Conditions
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => conditionsArray.append({
                        condition: "",
                        diagnosedDate: "",
                        currentlyTreated: false,
                        notes: "",
                      })}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Condition
                    </Button>
                  </div>

                  {conditionsArray.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                      <div>
                        <Label>Condition</Label>
                        <Input
                          {...register(`primaryMedicalInfo.preExistingConditions.${index}.condition`)}
                          placeholder="e.g., Diabetes Type 2"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Diagnosed Date</Label>
                        <Input
                          type="date"
                          {...register(`primaryMedicalInfo.preExistingConditions.${index}.diagnosedDate`)}
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          checked={watch(`primaryMedicalInfo.preExistingConditions.${index}.currentlyTreated`)}
                          onCheckedChange={(checked) => setValue(`primaryMedicalInfo.preExistingConditions.${index}.currentlyTreated`, checked as boolean)}
                        />
                        <Label className="text-sm">Currently treated</Label>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => conditionsArray.remove(index)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Current Medications */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Current Medications
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => medicationsArray.append({
                        name: "",
                        dosage: "",
                        frequency: "",
                        type: "generic",
                      })}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Medication
                    </Button>
                  </div>

                  {medicationsArray.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                      <div>
                        <Label>Medication</Label>
                        <Input
                          {...register(`primaryMedicalInfo.currentMedications.${index}.name`)}
                          placeholder="e.g., Metformin"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Dosage</Label>
                        <Input
                          {...register(`primaryMedicalInfo.currentMedications.${index}.dosage`)}
                          placeholder="e.g., 500mg"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Input
                          {...register(`primaryMedicalInfo.currentMedications.${index}.frequency`)}
                          placeholder="e.g., Twice daily"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={watch(`primaryMedicalInfo.currentMedications.${index}.type`)}
                          onValueChange={(value) => setValue(`primaryMedicalInfo.currentMedications.${index}.type`, value as "brand" | "generic")}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="generic">Generic</SelectItem>
                            <SelectItem value="brand">Brand Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => medicationsArray.remove(index)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Allergies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Allergies
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => allergiesArray.append({
                        allergen: "",
                        type: "medication",
                        severity: "mild",
                      })}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Allergy
                    </Button>
                  </div>

                  {allergiesArray.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                      <div>
                        <Label>Allergen</Label>
                        <Input
                          {...register(`primaryMedicalInfo.allergies.${index}.allergen`)}
                          placeholder="e.g., Penicillin"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={watch(`primaryMedicalInfo.allergies.${index}.type`)}
                          onValueChange={(value) => setValue(`primaryMedicalInfo.allergies.${index}.type`, value as "food" | "medication" | "environmental" | "other")}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="environmental">Environmental</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Severity</Label>
                        <Select
                          value={watch(`primaryMedicalInfo.allergies.${index}.severity`)}
                          onValueChange={(value) => setValue(`primaryMedicalInfo.allergies.${index}.severity`, value as "mild" | "moderate" | "severe")}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => allergiesArray.remove(index)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Recent Medical Events */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Recent Medical Events (Last 2 Years)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => eventsArray.append({
                        type: "hospitalization",
                        description: "",
                        date: "",
                        estimatedCost: 0,
                        ongoingCare: false,
                      })}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Event
                    </Button>
                  </div>

                  {eventsArray.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={watch(`primaryMedicalInfo.recentMedicalEvents.${index}.type`)}
                          onValueChange={(value) => setValue(`primaryMedicalInfo.recentMedicalEvents.${index}.type`, value as "hospitalization" | "surgery" | "emergency_visit")}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hospitalization">Hospitalization</SelectItem>
                            <SelectItem value="surgery">Surgery</SelectItem>
                            <SelectItem value="emergency_visit">Emergency Visit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          {...register(`primaryMedicalInfo.recentMedicalEvents.${index}.description`)}
                          placeholder="e.g., Appendectomy"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          {...register(`primaryMedicalInfo.recentMedicalEvents.${index}.date`)}
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          checked={watch(`primaryMedicalInfo.recentMedicalEvents.${index}.ongoingCare`)}
                          onCheckedChange={(checked) => setValue(`primaryMedicalInfo.recentMedicalEvents.${index}.ongoingCare`, checked as boolean)}
                        />
                        <Label className="text-sm">Ongoing care</Label>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => eventsArray.remove(index)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none sm:min-w-[120px]"
            >
              {isLoading ? "Analyzing..." : "Calculate Costs"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}