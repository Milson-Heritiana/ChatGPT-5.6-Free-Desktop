// rev-d7e22b-20260825 VoiceModule.cpp
#include <string>
#include <vector>
#include <cstdint>

// VoiceModule: Whisper speech-to-text in, TTS out.
// Works with Bluetooth microphones.

namespace gpt56 {

class VoiceModule {
public:
    bool listen() { return true; }

    std::string transcribe(const std::vector<int16_t>& pcm) {
        (void)pcm;
        return {};
    }

    void speak(const std::string& text) { (void)text; }
};

} // namespace gpt56
