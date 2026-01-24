"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Key, ExternalLink, Loader2, CheckCircle2, XCircle, X } from "lucide-react";

interface ApiKeyModalProps {
  onSuccess?: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export function ApiKeyModal({ onSuccess, onClose, canClose = false }: ApiKeyModalProps) {
  const { refreshApiKeyStatus } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleValidate = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationResult(null);
    setError("");

    try {
      const result = await api.validateApiKey(apiKey.trim());
      setValidationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !validationResult?.valid) return;

    setIsSaving(true);
    setError("");

    try {
      await api.storeApiKey(apiKey.trim());
      await refreshApiKeyStatus();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-6 space-y-6 relative">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-muted/50 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Key className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold">Add Your OpenRouter API Key</h2>
          <p className="text-sm text-muted-foreground">
            To use ContextMemory, you need an OpenRouter API key. Your key is encrypted
            and stored securely.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-or-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setValidationResult(null);
              }}
              disabled={isValidating || isSaving}
            />
          </div>

          {validationResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                validationResult.valid
                  ? "bg-green-500/10 text-green-600"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {validationResult.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleValidate}
              disabled={!apiKey.trim() || isValidating || isSaving}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate Key"
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!validationResult?.valid || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Get an API key from OpenRouter
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
