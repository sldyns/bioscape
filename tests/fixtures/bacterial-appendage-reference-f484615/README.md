# Frozen bacterial appendage reference

These four files are byte-for-byte copies from commit `f484615f06f1e416578023a4a52e291dd75f8972`. The manifest records source hashes and imports. Three.js is the only external dependency and is shared with the current implementation.

The standalone motor and flagellum must retain exact generated attributes, indices, transforms, colors and metadata. The test compares their complete fingerprints against these frozen generators inside the same JavaScript runtime, without rounding or tolerance. This avoids treating architecture-dependent transcendental results as a geometry regression. Historical macOS output hashes remain in the manifest.
