"use client";

import { useState, useEffect, useCallback } from "react";
import type { FieldDefinition } from "@/domain/entities/field-definition";
import type { Submission } from "@/domain/entities/submission";
import type { FieldValue } from "@/domain/entities/field-value";
import { useDraftAutosave } from "./use-draft-autosave";

interface FormFieldData {
  fieldDefinitionId: string;
  value?: string | number | null;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
  mediaItems?: { url: string; publicId: string }[];
}

interface DraftState {
  clientName: string;
  clientContact: string;
  formData: Record<string, FormFieldData>;
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
  setMediaItems: (id: string, items: { url: string; publicId: string }[]) => void;
  submitForm: () => Promise<void>;
  resubmitForm: () => Promise<void>;
}

export function useSubmission(tokenOrId: string, isExplicitForm: boolean = false): UseSubmissionReturn {
  const [isNew, setIsNew] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [values, setValues] = useState<FieldValue[]>([]);

  const { draft, updateDraft, clearDraft, isLoaded: draftLoaded } = useDraftAutosave<DraftState>(
    `scct_draft_${tokenOrId}`,
    { clientName: "", clientContact: "", formData: {} }
  );

  const clientName = draft?.clientName || "";
  const clientContact = draft?.clientContact || "";
  const formData = draft?.formData || {};

  const fetchContent = useCallback(async () => {
    if (!draftLoaded) return; // Wait until draft is verified

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${tokenOrId}${isExplicitForm ? "?type=form" : ""}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("not_found");
        throw new Error("server_error");
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const data = json.data;
      setIsNew(data.isNew);

      // Only inject database seed if the local draft hasn't been edited
      const hasDraftData = draft.clientName.trim() !== "" || Object.keys(draft.formData).length > 0;

      if (data.isNew) {
        setFormName(data.formTemplate?.name || "");
        setFormDescription(data.formTemplate?.description || "");
        setFields(data.fields || []);
        
        if (!hasDraftData) {
          const initialForm: Record<string, FormFieldData> = {};
          data.fields.forEach((f: FieldDefinition) => {
            initialForm[f.id] = { fieldDefinitionId: f.id };
          });
          updateDraft({ clientName: "", clientContact: "", formData: initialForm });
        }
      } else {
        setFormName(data.submission?.formTemplateId || "Submission");
        setSubmission(data.submission);
        setValues(data.values || []);
        setFields(data.fields || []);

        if (!hasDraftData) {
          const initialForm: Record<string, FormFieldData> = {};
          data.fields.forEach((f: FieldDefinition) => {
            const matchedVal = data.values?.find((v: FieldValue) => v.fieldDefinitionId === f.id);
            initialForm[f.id] = {
              fieldDefinitionId: f.id,
              value: matchedVal?.value,
              mediaUrl: matchedVal?.mediaUrl,
              mediaPublicId: matchedVal?.mediaPublicId,
              mediaItems: matchedVal?.mediaItems || [],
            };
          });
          updateDraft({ 
            clientName: data.submission?.clientName || "", 
            clientContact: data.submission?.clientContact || "", 
            formData: initialForm 
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setIsLoading(false);
    }
  }, [tokenOrId, draftLoaded]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const setClientName = (name: string) => updateDraft({ ...draft, clientName: name });
  const setClientContact = (contact: string) => updateDraft({ ...draft, clientContact: contact });

  const setFieldValue = (id: string, value: string | number | null) => {
    updateDraft({
      ...draft,
      formData: {
        ...draft.formData,
        [id]: { ...draft.formData[id], value, fieldDefinitionId: id },
      }
    });
  };

  const setMediaItems = (id: string, items: { url: string; publicId: string }[]) => {
    updateDraft({
      ...draft,
      formData: {
        ...draft.formData,
        [id]: { ...draft.formData[id], mediaItems: items, fieldDefinitionId: id },
      }
    });
  };

  const setMediaValue = (id: string, url: string, publicId: string) => {
    updateDraft({
      ...draft,
      formData: {
        ...draft.formData,
        [id]: { ...draft.formData[id], mediaUrl: url, mediaPublicId: publicId, fieldDefinitionId: id },
      }
    });
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
      clearDraft();
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
      clearDraft();
      // To strictly avoid stale draft data reloading right after submit:
      window.location.reload(); 
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
    setMediaItems,
    submitForm,
    resubmitForm,
  };
}
