# Admin Editor Image Management

The CineLink Editorial Desk can now associate a custom movie poster and a custom hero backdrop with an existing Myanmar movie-content record. The public Movie Detail page uses a custom image first and retains the original TMDB image whenever a custom image is not stored.

## Editor Workflow

First open `/admin`, sign in with the CineLink owner/admin account, and select **Edit** for the target movie record. The **Artwork overrides** panel appears after the record is selected.

| Image type | Recommended shape | Public use |
|---|---:|---|
| Movie poster | Vertical 2:3 | Poster at the left of the Movie Detail feature card |
| Hero backdrop | Wide 16:9 | Soft background artwork behind the Movie Detail page |

Use **Upload** to select a JPG, PNG, or WebP image smaller than 5 MB. The preview appears in the editor after the upload finishes. **Replace** stores a new image for the same image type. The `X` control removes only the stored image reference, so that CineLink immediately returns to the TMDB fallback artwork.

> Upload controls are visible only while editing an existing database record. Create and publish the Myanmar title, tagline, or Synopsis first; then use **Edit** to add the movie images.

## Verification

TMDB ID `601` was verified as a shared database record. Its public page displays the editor-managed Myanmar title, tagline, and Synopsis while no custom image is stored; it therefore continues to use the original TMDB poster and backdrop. This confirms the required content and artwork fallback order.
