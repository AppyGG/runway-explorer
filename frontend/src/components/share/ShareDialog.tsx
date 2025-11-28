import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAirfieldStore } from '@/store/airfield-store';
import { createShare } from '@/services/shareService';
import { Share2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  trigger?: React.ReactNode;
}

const ShareDialog = ({ trigger }: ShareDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { airfields, flightPaths } = useAirfieldStore();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateShare = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createShare(airfields, flightPaths, shareTitle || undefined);
      setShareUrl(result.url);
      
      toast({
        title: t('share.success.title'),
        description: t('share.success.description'),
      });
    } catch (err) {
      console.error('Failed to create share:', err);
      setError(t('share.error.creation'));
      
      toast({
        title: t('share.error.title'),
        description: t('share.error.creation'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      toast({
        title: t('share.copied.title'),
        description: t('share.copied.description'),
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: t('share.error.title'),
        description: t('share.error.copy'),
        variant: 'destructive'
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setTimeout(() => {
        setShareUrl(null);
        setShareTitle('');
        setError(null);
        setCopied(false);
      }, 200);
    }
  };

  const totalItems = airfields.length + flightPaths.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            {t('share.button')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('share.title')}</DialogTitle>
          <DialogDescription>
            {t('share.description')}
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shareTitle">{t('share.titleLabel')} ({t('share.optional')})</Label>
              <Input
                id="shareTitle"
                placeholder={t('share.titlePlaceholder')}
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{t('share.summary.airfields')}:</span>
                <span>{airfields.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{t('share.summary.flights')}:</span>
                <span>{flightPaths.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{t('share.summary.total')}:</span>
                <span>{totalItems}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>{t('share.encryption.title')}:</strong> {t('share.encryption.description')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('share.linkLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
              <p className="text-xs text-green-900 dark:text-green-100">
                {t('share.success.info')}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                {t('actions.cancel')}
              </Button>
              <Button onClick={handleCreateShare} disabled={loading || totalItems === 0}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('share.create')}
              </Button>
            </>
          ) : (
            <Button onClick={() => handleOpenChange(false)}>
              {t('actions.close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
