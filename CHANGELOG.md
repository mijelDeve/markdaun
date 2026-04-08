# Changelog

## [1.0.2](https://github.com/mijelDeve/markdaun/compare/v1.0.1...v1.0.2) (2026-04-08)


### Bug Fixes

* update release-it config ([91b88cf](https://github.com/mijelDeve/markdaun/commit/91b88cf1923d80e3ec14e95b012a21c785d479a6))

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-04-08

### Added

- Image support with wiki-links embedding (`![[image.png]]`)
- Image support from URLs (`![alt](https://...)`)
- Image selector button in toolbar for inserting images
- Local image loading as base64 (bypasses Electron security restrictions)
- Scroll synchronization between editor and preview in split mode

### Changed

- Updated README with all features
- Added documentation prompt for generating project docs

### Fixed

- Text color in context menu for dark mode
- Delete functionality now available for all files (not just .md files)

## [1.0.0] - 2026-04-07

### Added

- Initial release
- Markdown editor with split view (editor + preview)
- File explorer sidebar (Obsidian-style)
- Git integration (clone, pull, push, commit)
- SSH key authentication for Git
- Integrated terminal (PowerShell)
- GFM support (tables, checkboxes, syntax highlighting)
- Light/dark theme toggle
- Multiple tabs support
- Custom application icon
- Context menu for creating folders and files
- Delete functionality with confirmation dialog
- Close all folders button in sidebar
- Find current file button in sidebar
