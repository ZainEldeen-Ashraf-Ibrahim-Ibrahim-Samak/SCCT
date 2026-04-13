"use client";

import { useState, useEffect, useCallback } from "react";
import type { FieldDefinition } from "@/domain/entities/field-definition";
import type { Submission } from "@/domain/entities/submission";
import type { FieldValue } from "@/domain/entities/field-value";

interface FormFieldData {
  fieldDefinitionId: string;
  value?: string | number | null;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
}

interface UseSubmissionReturn {
  isNew: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  formName: string;
  formDescription: string;
  fields: FieldDefinition[];
  submission: Submission | null;
  values: FieldValue[];
  formData: Record<string, FormFieldData>;
  clientName: string;
  setClientName: (name: string) => void;
  clientContact: string;
  setClientContact: (contact: string) => void;
  setFieldValue: (id: string, value: string | number | null) => void;
  setMediaValue: (id: string, url: string, publicId: string) => void;
  submitForm: () => Promise<void>;
  resubmitForm: () => Promise<void>;
}

export function useSubmission(tokenOrId: string): UseSubmissionReturn {
  const [isNew, setIsNew] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [values, setValues] = useState<FieldValue[]>([]);

  // State for form edits
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [formData, setFormData] = useState<Record<string, FormFieldData>>({});

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${tokenOrId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("not_found");
        throw new Error("server_error");
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const data = json.data;
      setIsNew(data.isNew);

      if (data.isNew) {
        setFormName(data.formTemplate?.name || "");
        setFormDescription(data.formTemplate?.description || "");
        setFields(data.fields || []);
        // Initialize empty state
        const initialForm: Record<string, FormFieldData> = {};
        data.fields.forEach((f: FieldDefinition) => {
          initialForm[f.id] = { fieldDefinitionId: f.id };
        });
        setFormData(initialForm);
      } else {
        setFormName(data.submission?.formTemplateId || "Submission");
        setSubmission(data.submission);
        setValues(data.values || []);
        setFields(data.fields || []);

        setClientName(data.submission?.clientName || "");
        setClientContact(data.submission?.clientContact || "");

        // Pre-fill existing data
        const initialForm: Record<string, FormFieldData> = {};
        data.fields.forEach((f: FieldDefinition) => {
          const matchedVal = data.values?.find((v: FieldValue) => v.fieldDefinitionId === f.id);
          initialForm[f.id] = {
            fieldDefinitionId: f.id,
            value: matchedVal?.value,
            mediaUrl: matchedVal?.mediaUrl,
            mediaPublicId: matchedVal?.mediaPublicId,
          };
        });
        setFormData(initialForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setIsLoading(false);
    }
  }, [tokenOrId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const setFieldValue = (id: string, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], value, fieldDefinitionId: id },
    }));
  };

  const setMediaValue = (id: string, url: string, publicId: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], mediaUrl: url, mediaPublicId: publicId, fieldDefinitionId: id },
    }));
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        clientName,
        clientContact,
        fieldValues: Object.values(formData),
      };

      const res = await fetch("/api/submissions/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to submit");
      // Force refresh data
      window.location.href = `/submit/${json.data.accessToken}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resubmitForm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        clientName,
        clientContact,
        fieldValues: Object.values(formData),
      };

      const res = await fetch(`/api/submissions/${tokenOrId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to resubmit");
      await fetchContent(); // refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resubmission failed");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isNew,
    isLoading,
    isSubmitting,
    error,
    formName,
    formDescription,
    fields,
    submission,
    values,
    formData,
    clientName,
    setClientName,
    clientContact,
    setClientContact,
    setFieldValue,
    setMediaValue,
    submitForm,
    resubmitForm,
  };
}
