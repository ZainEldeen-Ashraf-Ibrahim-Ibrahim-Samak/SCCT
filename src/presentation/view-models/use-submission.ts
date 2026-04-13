"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import type { FieldDefinition } from "@/domain/entities/field-definition";
import type { Submission } from "@/domain/entities/submission";
import type { FieldValue } from "@/domain/entities/field-value";
import { useDraftAutosave } from "./use-draft-autosave";
import { logger } from "@/lib/dev-logger";
import { toast } from "sonner";

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

interface SubmissionFieldPayload {
  fieldDefinitionId: string;
  value: string | number | null;
  mediaUrl: string | null;
  mediaPublicId: string | null;
  mediaItems: { url: string; publicId: string }[];
}

function normalizeSubmissionFieldValues(
  formData: Record<string, FormFieldData>,
  fields: FieldDefinition[],
): SubmissionFieldPayload[] {
  return fields.map((field) => {
    const raw = formData[field.id];
    return {
      fieldDefinitionId: field.id,
      value: raw?.value ?? null,
      mediaUrl: raw?.mediaUrl ?? null,
      mediaPublicId: raw?.mediaPublicId ?? null,
      mediaItems: Array.isArray(raw?.mediaItems) ? raw.mediaItems : [],
    };
  });
}

function summarizeFieldPayload(fieldValues: SubmissionFieldPayload[]) {
  return {
    total: fieldValues.length,
    withText: fieldValues.filter(
      (fv) => fv.value !== null && fv.value !== undefined && String(fv.value).trim().length > 0,
    ).length,
    withMediaUrl: fieldValues.filter((fv) => !!fv.mediaUrl).length,
    withMediaItems: fieldValues.filter((fv) => fv.mediaItems.length > 0).length,
    ids: fieldValues.map((fv) => fv.fieldDefinitionId),
  };
}

function hasMeaningfulDraftData(draft: DraftState | undefined): boolean {
  if (!draft) return false;

  if (draft.clientName.trim().length > 0 || draft.clientContact.trim().length > 0) {
    return true;
  }

  return Object.values(draft.formData || {}).some((field) => {
    const hasText =
      field?.value !== undefined &&
      field?.value !== null &&
      String(field.value).trim().length > 0;
    const hasMedia = !!field?.mediaUrl && field.mediaUrl.trim().length > 0;
    const hasMediaItems = Array.isArray(field?.mediaItems) && field.mediaItems.length > 0;

    return hasText || hasMedia || hasMediaItems;
  });
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
  submitForm: (explicitFormData?: Record<string, FormFieldData>) => Promise<void>;
  resubmitForm: (explicitFormData?: Record<string, FormFieldData>) => Promise<void>;
  /** True briefly after an SSE status change is received — allows the UI to animate */
  statusChangedLive: boolean;
}

export function useSubmission(tokenOrId: string): UseSubmissionReturn {
  const locale = useLocale();
  const [isNew, setIsNew] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [values, setValues] = useState<FieldValue[]>([]);
  const [statusChangedLive, setStatusChangedLive] = useState(false);

  const { draft, updateDraft, clearDraft, isLoaded: draftLoaded } = useDraftAutosave<DraftState>(
    `scct_draft_${tokenOrId}`,
    { clientName: "", clientContact: "", formData: {} }
  );

  const clientName = draft?.clientName || "";
  const clientContact = draft?.clientContact || "";
  const formData = draft?.formData || {};

  // Use a ref to access draft state inside fetchContent without adding it as a dependency.
  // This prevents the fetch callback from being recreated on every keystroke.
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Queue for SSE events received during active editing.
  // Events are stored here and only processed after submit/navigate.
  const pendingSSERef = useRef<string[]>([]);
  const isEditingRef = useRef(false);

  // Track whether the user has started editing (any draft mutation after initial load)
  const setClientName = (name: string) => {
    isEditingRef.current = true;
    updateDraft(prev => ({ ...prev, clientName: name }));
  };
  const setClientContact = (contact: string) => {
    isEditingRef.current = true;
    updateDraft(prev => ({ ...prev, clientContact: contact }));
  };

  const setFieldValue = (id: string, value: string | number | null) => {
    isEditingRef.current = true;
    updateDraft(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [id]: { ...prev.formData[id], value, fieldDefinitionId: id },
      }
    }));
  };

  const setMediaItems = (id: string, items: { url: string; publicId: string }[]) => {
    isEditingRef.current = true;
    updateDraft(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [id]: { ...prev.formData[id], mediaItems: items, fieldDefinitionId: id },
      }
    }));
  };

  const setMediaValue = (id: string, url: string, publicId: string) => {
    isEditingRef.current = true;
    updateDraft(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [id]: { ...prev.formData[id], mediaUrl: url, mediaPublicId: publicId, fieldDefinitionId: id },
      }
    }));
  };

  // Stable fetchContent — depends only on tokenOrId and draftLoaded.
  // Reads draft state via ref to avoid recreating the callback on every keystroke.
  const fetchContent = useCallback(async (background = false) => {
    if (!draftLoaded) return;

    if (!background) setIsLoading(true);
    setError(null);
    try {
      // If we used window.history.pushState, tokenOrId might still reflect the old token
      // We must grab the actual token from the URL for the fetch if it changed
      const currentToken = window.location.pathname.split("/").pop() || tokenOrId;
      const res = await fetch(`/api/submissions/${currentToken}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 404) throw new Error("not_found");
        throw new Error("server_error");
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const data = json.data;
      setIsNew(data.isNew);

      // Read draft via ref — no reactive dependency
      const currentDraft = draftRef.current;
      const hasDraftData = hasMeaningfulDraftData(currentDraft);

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
        setFormName("");
        setFormDescription("");
        setSubmission(data.submission);
        setValues(data.values || []);
        setFields(data.fields || []);

        // Existing submissions should reflect DB state after reload/admin updates.
        // Keep local draft only while user is actively editing and there is meaningful draft content.
        const shouldHydrateFromServer = !isEditingRef.current || !hasDraftData;
        if (shouldHydrateFromServer) {
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
        } else {
          logger.debug("Preserving in-progress local draft over server payload", {
            tokenOrId: currentToken,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setIsLoading(false);
    }
  }, [tokenOrId, draftLoaded, updateDraft]);

  useEffect(() => {
    fetchContent();

    // Listen for real-time status updates via SSE
    if (!tokenOrId) return;

    let reconnectTimeout: NodeJS.Timeout;
    let eventSource: EventSource | null = null;

    function connect() {
      if (eventSource) eventSource.close();
      
      eventSource = new EventSource(`/api/submissions/${tokenOrId}/events`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "STATUS_CHANGED") {
            // Queue SSE events during active editing — process after submit/navigate
            if (isEditingRef.current) {
              pendingSSERef.current.push(data.type);
            } else {
              // Show a toast so the user knows the status changed
              const newStatus = data.status;
              if (newStatus === "viewed") {
                toast.info("✓ Your submission has been viewed");
              } else if (newStatus === "needs_rewrite") {
                toast.warning("Your submission needs revision");
              }
              // Trigger live-update animation flag
              setStatusChangedLive(true);
              setTimeout(() => setStatusChangedLive(false), 2000);
              fetchContent(true);
            }
          }
        } catch {
          // silent fail for heartbeat/ping
        }
      };

      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        reconnectTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [fetchContent, tokenOrId]);

  const submitForm = async (explicitFormData?: Record<string, FormFieldData>) => {
    setIsSubmitting(true);
    setError(null);
    
    // Safety check for empty submissions
    const currentDraft = draftRef.current;
    
    // Prefer explicitly passed reactive formData to resolve boundary scope bypasses during hydration
    const resolvedFormData = explicitFormData || currentDraft.formData;
    const fieldValues = normalizeSubmissionFieldValues(resolvedFormData, fields);
    const fieldSummary = summarizeFieldPayload(fieldValues);
    
    if (
      !currentDraft.clientName.trim() &&
      fieldSummary.withText === 0 &&
      fieldSummary.withMediaUrl === 0 &&
      fieldSummary.withMediaItems === 0
    ) {
      logger.warn("Submit attempt with empty draft", { tokenOrId, fieldSummary });
      setError("Please fill out the form before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const currentToken = window.location.pathname.split("/").pop() || tokenOrId;
      const endpoint = `/api/submissions/${currentToken}`;
      const payload = {
        clientName: currentDraft.clientName,
        clientContact: currentDraft.clientContact,
        fieldValues,
      };

      logger.info("Submitting form payload prepared", {
        endpoint,
        tokenOrId: currentToken,
        clientNameLength: currentDraft.clientName.length,
        clientContactLength: currentDraft.clientContact.length,
        fieldSummary,
      });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      logger.info("Submission API response received", {
        endpoint,
        ok: res.ok,
        status: res.status,
        success: !!json?.success,
        hasAccessToken: !!json?.data?.accessToken,
      });
      if (!json.success) throw new Error(json.error || "Failed to submit");
      clearDraft();
      isEditingRef.current = false;
      pendingSSERef.current = [];
      // Client-side navigation via history API prevents full component remount
      const newUrl = `/${locale}/submit/${json.data.accessToken}`;
      window.history.pushState(null, "", newUrl);
      // Silently refresh data to get 'isViewOnly=true' without flashing skeletons
      await fetchContent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resubmitForm = async (explicitFormData?: Record<string, FormFieldData>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const currentDraft = draftRef.current;
      const resolvedFormData = explicitFormData || currentDraft.formData;
      const fieldValues = normalizeSubmissionFieldValues(resolvedFormData, fields);
      const fieldSummary = summarizeFieldPayload(fieldValues);
      const currentToken = window.location.pathname.split("/").pop() || tokenOrId;
      const endpoint = `/api/submissions/${currentToken}`;
      
      const payload = {
        clientName: currentDraft.clientName,
        clientContact: currentDraft.clientContact,
        fieldValues,
      };

      logger.info("Resubmitting form payload prepared", {
        endpoint,
        tokenOrId: currentToken,
        clientNameLength: currentDraft.clientName.length,
        clientContactLength: currentDraft.clientContact.length,
        fieldSummary,
      });

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      logger.info("Resubmission API response received", {
        endpoint,
        ok: res.ok,
        status: res.status,
        success: !!json?.success,
      });
      if (!json.success) throw new Error(json.error || "Failed to resubmit");
      clearDraft();
      isEditingRef.current = false;
      pendingSSERef.current = [];
      // Silently refresh data without flashing skeletons
      await fetchContent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resubmission failed");
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
    statusChangedLive,
  };
}
