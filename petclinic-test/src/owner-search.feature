Feature: Search owners
  As a clinic user
  I want to filter owners by typing any part of what the grid shows
  So that I can quickly find the owners I care about

  Background:
    Given the clinic has these owners
      | Harry Potter   |
      | Beatrix Potter |

  Scenario Outline: Filter owners by text, ignoring case
    When I open the owners page
    And I search owners for "<search>"
    Then exactly these owners are listed: "<owners>"

    Examples:
      | search | owners                       |
      | Potter | Harry Potter, Beatrix Potter |
      | Pot    | Harry Potter, Beatrix Potter |
      | otter  | Harry Potter, Beatrix Potter |
      | potter | Harry Potter, Beatrix Potter |
      | harry  | Harry Potter                 |
      | Zzzz   |                              |

  @generate_sequence
  Scenario: Searching with an empty text lists the first page of owners
    When I open the owners page
    And I search owners for ""
    Then the first 10 owners of the clinic are listed

  Scenario: The next page lists the remaining owners
    When I open the owners page
    And I go to the next page
    Then the remaining owners of the clinic are listed after the first 10
