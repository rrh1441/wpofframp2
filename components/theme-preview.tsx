// components/theme-preview.tsx
// Note: This component might become very simple or even unnecessary if
// all content is handled directly in page.tsx's loop.
// Keeping it for now, but simplified.

// Removed imports for Card components, Button, Link as they are handled in page.tsx

// Removed imageSrc from props as it's not used
interface ThemePreviewContentProps {
  name: string;
  description: string;
}

// Renamed component to reflect it only provides content
export default function ThemePreviewContent({ name, description }: ThemePreviewContentProps) {
  // The Card, CardHeader, CardTitle, CardContent structure is now applied in `app/page.tsx`
  // This component now just needs to provide the core data points if needed elsewhere,
  // or it can be removed entirely if the loop in page.tsx directly uses THEMES[key].name and THEMES[key].description.
  // Returning null or fragments as the parent loop handles rendering.
  // For simplicity, let's assume the loop in page.tsx handles it directly and this component is no longer used for rendering the cards.
  // If you *do* want to keep it for structuring, it would return fragments:
  /*
  return (
    <>
      <CardTitle className="text-xl">{name}</CardTitle> // This would be placed inside CardHeader by parent
      <p className="text-sm text-muted-foreground">{description}</p> // This would be placed inside CardContent by parent
    </>
  );
  */
  // Let's return null, assuming page.tsx handles the content directly from THEMES object.
  return null;
}

// **Important:** You should now remove the <ThemePreviewContent ... /> component usage
// from the `page.tsx` file's theme rendering loop if you want to render
// the title and description directly within the loop as shown in the updated page.tsx above.
// The updated `page.tsx` already renders the content directly and doesn't use this component.
// I've updated the import name in page.tsx to `ThemePreviewContent` to avoid confusion,
// but the loop now renders the <CardTitle> and description directly.