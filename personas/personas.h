// rev-d7e22b-20260825 personas.h
#pragma once
#include <string>

namespace gpt56 {

enum class Persona { Sol, Luna, Terra, Cyber };

Persona fromName(const std::string& name);
const char* promptFor(Persona p);

inline int accentFor(Persona p) {
    switch (p) {
        case Persona::Luna:  return 0x6C8CFF;
        case Persona::Terra: return 0x58B368;
        case Persona::Cyber: return 0xFF5964;
        default:             return 0xFFB347; // sol
    }
}

} // namespace gpt56
