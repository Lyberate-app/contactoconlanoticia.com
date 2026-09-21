<?php

declare(strict_types=1);

namespace App\Validation;

use App\Helpers\Uuid;

class Validator
{
    private array $data;
    private array $rules;
    private array $errors = [];

    public function __construct(array $data, array $rules)
    {
        $this->data = $data;
        $this->rules = $rules;
        $this->executeValidation();
    }

    public static function make(array $data, array $rules): self
    {
        return new self($data, $rules);
    }

    public function passes(): bool
    {
        return empty($this->errors);
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }

    private function executeValidation(): void
    {
        foreach ($this->rules as $field => $fieldRules) {
            $ruleList = is_string($fieldRules) ? explode('|', $fieldRules) : $fieldRules;
            $value = $this->data[$field] ?? null;
            $isFieldPresent = array_key_exists($field, $this->data) && $value !== null && $value !== '';

            foreach ($ruleList as $rule) {
                $ruleName = $rule;
                $ruleParam = null;

                if (str_contains($rule, ':')) {
                    [$ruleName, $ruleParam] = explode(':', $rule, 2);
                }

                if ($ruleName === 'required') {
                    if (!$isFieldPresent) {
                        $this->addError($field, "El campo '{$field}' es obligatorio.");
                        break; // Stop validating other rules for this field if required fails
                    }
                    continue;
                }

                // If not required and value is null or empty, skip further format checks
                if (!$isFieldPresent) {
                    continue;
                }

                switch ($ruleName) {
                    case 'uuid':
                        if (!is_string($value) || !Uuid::isValid($value)) {
                            $this->addError($field, "El campo '{$field}' debe ser un UUID válido.");
                        }
                        break;

                    case 'email':
                        if (!is_string($value) || filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
                            $this->addError($field, "El campo '{$field}' debe ser un correo electrónico válido.");
                        }
                        break;

                    case 'string':
                        if (!is_string($value)) {
                            $this->addError($field, "El campo '{$field}' debe ser una cadena de texto.");
                        }
                        break;

                    case 'numeric':
                        if (!is_numeric($value)) {
                            $this->addError($field, "El campo '{$field}' debe ser un valor numérico.");
                        }
                        break;

                    case 'integer':
                        if (filter_var($value, FILTER_VALIDATE_INT) === false) {
                            $this->addError($field, "El campo '{$field}' debe ser un número entero.");
                        }
                        break;

                    case 'boolean':
                        if (!is_bool($value) && !in_array($value, [0, 1, '0', '1', 'true', 'false'], true)) {
                            $this->addError($field, "El campo '{$field}' debe ser un valor booleano.");
                        }
                        break;

                    case 'enum':
                        $allowed = explode(',', (string) $ruleParam);
                        if (!in_array((string) $value, $allowed, true)) {
                            $this->addError($field, "El campo '{$field}' debe ser uno de los siguientes valores: " . implode(', ', $allowed) . '.');
                        }
                        break;

                    case 'min':
                        $min = (int) $ruleParam;
                        if (is_string($value) && mb_strlen($value) < $min) {
                            $this->addError($field, "El campo '{$field}' debe tener al menos {$min} caracteres.");
                        } elseif (is_numeric($value) && (float) $value < $min) {
                            $this->addError($field, "El campo '{$field}' no puede ser menor que {$min}.");
                        }
                        break;

                    case 'max':
                        $max = (int) $ruleParam;
                        if (is_string($value) && mb_strlen($value) > $max) {
                            $this->addError($field, "El campo '{$field}' no puede superar {$max} caracteres.");
                        } elseif (is_numeric($value) && (float) $value > $max) {
                            $this->addError($field, "El campo '{$field}' no puede ser mayor que {$max}.");
                        }
                        break;

                    case 'date':
                        if (!is_string($value) || strtotime($value) === false) {
                            $this->addError($field, "El campo '{$field}' debe tener un formato de fecha válido.");
                        }
                        break;
                }
            }
        }
    }

    private function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }
}

