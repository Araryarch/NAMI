# Release Checklist

Gunakan checklist ini sebelum membuat release baru.

## Pre-Release

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] Example tests passing: `npm run test:examples`
- [ ] No linting errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Feature status checked: `npm run features`

### Version Update
- [ ] Update version in `package.json`
- [ ] Update version in `src/version.ts`
- [ ] Update CHANGELOG.md with changes
- [ ] Update README.md if needed

### Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md has all changes
- [ ] Examples are documented
- [ ] API changes documented

### Testing
- [ ] Build locally: `npm run build`
- [ ] Test CLI: `nami --version`
- [ ] Test examples: `nami run examples/hello.nm`
- [ ] Build executable: `npm run build:executable`
- [ ] Test executable: `./dist/nami-* --version`

## Release Process

### 1. Commit Changes
```bash
git add .
git commit -m "Release v0.x.0"
```

### 2. Create Tag
```bash
git tag v0.x.0
```

### 3. Push to GitHub
```bash
git push origin main
git push origin v0.x.0
```

### 4. Monitor GitHub Actions
- Check [Actions](https://github.com/Araryarch/NAMI/actions)
- Verify all workflows pass
- Check build artifacts

### 5. Verify Release
- Check [Releases](https://github.com/Araryarch/NAMI/releases)
- Download and test binaries
- Verify release notes

## Post-Release

### Verification
- [ ] All platform binaries available
- [ ] Installation script works
- [ ] Release notes are clear
- [ ] Download links work

### Communication
- [ ] Announce on social media
- [ ] Update project website
- [ ] Notify users of breaking changes

### Monitoring
- [ ] Check download statistics
- [ ] Monitor issue reports
- [ ] Track user feedback

## Rollback Plan

If issues are found:

1. Delete the release on GitHub
2. Delete the tag: `git tag -d v0.x.0 && git push origin :refs/tags/v0.x.0`
3. Fix issues
4. Create new release with patch version

## Emergency Hotfix

For critical bugs:

1. Create hotfix branch from tag
2. Fix the bug
3. Test thoroughly
4. Create patch release (v0.x.1)
5. Follow release process

## Version Numbering

- **Major** (x.0.0): Breaking changes
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

## Release Types

### Stable Release
- Full testing
- Complete documentation
- Production ready

### Beta Release
- Feature complete
- Testing in progress
- May have known issues

### Alpha Release
- Early preview
- Incomplete features
- For testing only

### Nightly Build
- Automated daily build
- Latest commit
- Unstable

## Notes

- Always test on all platforms before release
- Keep CHANGELOG.md updated
- Communicate breaking changes clearly
- Provide migration guides for major versions
