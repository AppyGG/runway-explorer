import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector = ({ className = '' }: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Map language codes to their names
  const languages = [
    { code: 'en', name: t('settings.en') },
    { code: 'fr', name: t('settings.fr') },
  ];

  // Get current language name
  const currentLanguage = languages.find(lang => lang.code === i18n.language)?.name || languages[0].name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('settings.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer ${i18n.language === language.code ? 'font-bold' : ''}`}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;